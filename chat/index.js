const { createApp, ref } = Vue;

createApp({
    setup() {
        const roomId = ref('');
        const username = ref('User_' + Math.floor(Math.random() * 999));
        const input = ref('');
        const messages = ref([]);
        const onlineUsers = ref([]);
        const isJoined = ref(false);
        const isHost = ref(false);

        let peer = null;
        let connections = []; // Host's list of guests
        let hostConn = null;  // Guest's connection to host

        const init = () => {
            if (!roomId.value) return alert("Enter a Room ID");

            peer = new Peer(roomId.value);

            // 1. If we successfully claim the Room ID, we are the Host
            peer.on('open', () => {
                isJoined.value = true;
                isHost.value = true;
                updateUsers();
            });

            // 2. If the ID is taken, we are a Guest
            peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    peer = new Peer(); // Random ID for guest
                    peer.on('open', () => {
                        hostConn = peer.connect(roomId.value);
                        hostConn.on('open', () => {
                            isJoined.value = true
                        });
                        hostConn.on('data', (d) => handleData(d));
                    });
                }
            });

            // 3. Listen for incoming Guest connections (Host only)
            peer.on('connection', (c) => handleConnection(c));
        };

        const handleConnection = (c) => {
            connections.push(c);
            c.on('data', (d) => handleData(d, c.peer));
            c.on('close', () => {
                connections = connections.filter(x => x.peer !== c.peer);
                updateUsers();
            });
            updateUsers();
        };

        const handleData = (d, senderPeerId) => {
            // If it's a message/image, display it
            if (d.type === 'msg' || d.type === 'image') {
                messages.value.push(d.payload);
                // If Host, relay to other guests
                if (isHost.value) broadcast(d, senderPeerId);
            }
            // If it's a user update, refresh the list
            else if (d.type === 'user-update') {
                onlineUsers.value = d.users;
            }
        };

        const broadcast = (data, excludePeerId) => {
            connections.forEach(c => { if(c.peer !== excludePeerId) c.send(data); });
        };

        const updateUsers = () => {
            // Update local user list
            onlineUsers.value = [username.value, ...connections.map(c => c.peer)];

            // If host, push updated list to all guests
            if (isHost.value) {
                const data = { type: 'user-update', users: onlineUsers.value };
                connections.forEach(c => c.send(data));
            }
        };

        const broadcastUserUpdate = () => {
            // Triggered when username changes
            updateUsers();
        };

        const send = (payload = { text: input.value, type: 'msg' }) => {
            if (!payload.text && !payload.image) return;

            const msg = {
                sender: username.value,
                id: Date.now(),
          ...payload
            };

            // Push to own screen
            messages.value.push({ ...msg, self: true });

            // Send to peers
            const data = { type: payload.type === 'image' ? 'image' : 'msg', payload: msg };

            if (isHost.value) broadcast(data);
            else if (hostConn) hostConn.send(data);

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
                } catch (err) { alert("Invalid chat file"); }
            };
            reader.readAsText(file);
        };

        const exportChat = () => {
            const textOnly = messages.value.filter(m => !m.image);
            const blob = new Blob([JSON.stringify(textOnly, null, 2)], {type: 'application/json'});
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
