const { createApp, ref, nextTick } = Vue;

createApp({
    setup() {
        const roomId = ref('');
        const username = ref('User_' + Math.floor(Math.random() * 999));
        const input = ref('');
        const messages = ref([]);
        const onlineUsers = ref([]);
        const isJoined = ref(false);

        let peer = null;
        let connections = []; 
        let currentIdIndex = 0;
        let roomBaseName = '';

        // Helper to auto scroll chat down
        const scrollToBottom = () => {
            nextTick(() => {
                const container = document.getElementById('msg-container');
                if (container) container.scrollTop = container.scrollHeight;
            });
        };

        const init = (isGlobal = false) => {
            if (isGlobal) {
                roomBaseName = 'avero_global_public_room';
            } else {
                if (!roomId.value.trim()) return alert("Enter a Room ID");
                roomBaseName = roomId.value.trim();
            }

            currentIdIndex = 0;
            tryConnect();
        };

        const tryConnect = () => {
            const attemptId = `${roomBaseName}_${currentIdIndex}`;
            peer = new Peer(attemptId);

            peer.on('open', (id) => {
                isJoined.value = true;
                onlineUsers.value = [username.value];

                // 1. Listen for newer peers joining down the road
                peer.on('connection', (c) => handleConnection(c));

                // 2. Proactively connect backwards to all existing indices before us
                // We test up to currentIdIndex + 5 to safely bridge any unexpected dead slots
                const maxSearch = Math.max(currentIdIndex + 5, 15);
                for (let i = 0; i < maxSearch; i++) {
                    if (i === currentIdIndex) continue;
                    const targetId = `${roomBaseName}_${i}`;
                    const c = peer.connect(targetId, {
                        metadata: { username: username.value }
                    });
                    handleConnection(c);
                }
            });

            peer.on('error', (err) => {
    // 1. Slot is taken: shift up by 1 and try claiming the next sequential slot
    if (err.type === 'unavailable-id') {
        peer.destroy();
        currentIdIndex++;
        tryConnect();
    } 
    // 2. We tried connecting to a slot that nobody is using: ignore it safely!
    else if (err.type === 'peer-unavailable') {
        // Quietly do nothing. This is normal during mesh discovery probing.
    } 
    // 3. Log any actual critical errors
    else {
        console.error("Critical PeerJS error:", err);
    }
});

        };

        const handleConnection = (c) => {
            // Guard against duplicate connection setups
            if (connections.some(x => x.peer === c.peer)) return;

            c.on('open', () => {
                connections.push(c);
                c.username = c.metadata?.username || `Guest_${c.peer.split('_').pop()}`;
                
                // Immediately reply back with our name so they can update their local UI lists
                c.send({ type: 'name-announcement', username: username.value });
                updateUsersList();

                c.on('data', (d) => handleData(d, c));
                
                c.on('close', () => {
                    connections = connections.filter(x => x.peer !== c.peer);
                    updateUsersList();
                });
            });

            // Catch errors if some backward IDs are blank/inactive
            c.on('error', () => {
                connections = connections.filter(x => x.peer !== c.peer);
                updateUsersList();
            });
        };

        const handleData = (d, senderConn) => {
            if (d.type === 'msg' || d.type === 'image') {
                messages.value.push(d.payload);
                scrollToBottom();
            } 
            else if (d.type === 'name-announcement') {
                senderConn.username = d.username;
                updateUsersList();
            }
        };

        const updateUsersList = () => {
            // Compile every unique active peer connection's configured username
            const activeNames = connections.filter(c => c.open).map(c => c.username);
            onlineUsers.value = [username.value, ...new Set(activeNames)];
        };

        const broadcastUserUpdate = () => {
            if (!isJoined.value) return;
            updateUsersList();
            
            // Push updated metadata directly to every connection
            connections.forEach(c => {
                if (c.open) {
                    c.send({ type: 'name-announcement', username: username.value });
                }
            });
        };

        const send = (payload = null) => {
            if (!payload) {
                if (!input.value.trim()) return;
                payload = { text: input.value, type: 'msg' };
            }

            const msg = {
                sender: username.value,
                id: Date.now() + Math.random(),
                ...payload
            };

            messages.value.push({ ...msg, self: true });
            scrollToBottom();

            // Fire data payload across all individual open pipes concurrently
            connections.forEach(c => {
                if (c.open) {
                    c.send({ type: payload.type, payload: msg });
                }
            });

            input.value = '';
        };

        const sendImage = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => send({ image: ev.target.result, type: 'image' });
            reader.readAsDataURL(file);
        };

        const importChat = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    messages.value = [...messages.value, ...imported];
                    scrollToBottom();
                } catch (err) { alert("Invalid chat file"); }
            };
            reader.readAsText(file);
        };

        const exportChat = () => {
            const textOnly = messages.value.filter(m => !m.image);
            const blob = new Blob([JSON.stringify(textOnly, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `chat_export_${Date.now()}.json`;
            a.click();
        };

        return {
            roomId, username, input, messages, onlineUsers, isJoined,
            init, send, sendImage, exportChat, broadcastUserUpdate, importChat
        };
    }
}).mount('#app');
