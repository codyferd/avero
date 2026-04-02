const { createApp, ref, nextTick } = Vue;

createApp({
    setup() {
        const roomId = ref('');
        const myName = ref('User_' + Math.floor(Math.random() * 999));
        const isJoined = ref(false);
        const isHost = ref(false); // Track if we own the room
        const currentInput = ref('');
        const messages = ref([]);

        let peer = null;
        let connections = [];
        let hostConn = null;

        const initRoom = () => {
            if (!roomId.value) return;
            const cleanRoomId = roomId.value.toUpperCase().trim();

            peer = new Peer(cleanRoomId, {
                config: { 'iceServers': [{ url: 'stun:stun.l.google.com:19302' }] }
            });

            peer.on('open', (id) => {
                isJoined.value = true;
                isHost.value = true; // We successfully claimed the ID
                addSystemMessage(`Mesh Server Started: ${id}`);
                setupHostListeners();
            });

            peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    joinAsGuest(cleanRoomId);
                } else {
                    console.error("Peer Error:", err);
                }
            });
        };

        // --- HOST LOGIC ---
        const setupHostListeners = () => {
            peer.on('connection', (conn) => {
                connections.push(conn);

                // When a new guest joins, send them the existing chat history
                conn.on('open', () => {
                    if (messages.value.length > 0) {
                        conn.send({ type: 'history', data: messages.value });
                    }
                });

                conn.on('data', (data) => {
                    broadcastToMesh(data);
                    receivePayload(data);
                });
                addSystemMessage("Peer synchronized with mesh.");
            });
        };

        const broadcastToMesh = (payload) => {
            connections.forEach(c => { if (c.open) c.send(payload); });
        };

        // --- GUEST LOGIC ---
        const joinAsGuest = (id) => {
            peer = new Peer();
            peer.on('open', () => {
                hostConn = peer.connect(id);
                hostConn.on('open', () => {
                    isJoined.value = true;
                    isHost.value = false;
                    addSystemMessage(`Connected to Mesh: ${id}`);
                });
                hostConn.on('data', (data) => {
                    // Check if host is sending full history
                    if (data.type === 'history') {
                        messages.value = data.data;
                        scrollToBottom();
                    } else {
                        receivePayload(data);
                    }
                });
            });
        };

        // --- PERSISTENCE FEATURES ---

        // Only the Host uses this to load a .json file into the mesh
        const importLogs = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    messages.value = imported;
                    // If guests are already connected, sync them immediately
                    broadcastToMesh({ type: 'history', data: messages.value });
                    addSystemMessage("Historical logs injected into mesh.");
                } catch (err) {
                    alert("Invalid Avero Log File.");
                }
            };
            reader.readAsText(file);
        };

        const exportHostLogs = () => {
            if (!isHost.value) return;
            const dataStr = JSON.stringify(messages.value);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `avero_server_${roomId.value}_backup.json`;
            link.click();
        };

        // --- CORE LOGIC ---
        const sendPayload = () => {
            if (!currentInput.value) return;
            const payload = {
                sender: myName.value,
          text: currentInput.value,
          time: Date.now(),
          id: Math.random().toString(36).substr(2, 9)
            };
            if (hostConn) hostConn.send(payload);
            else broadcastToMesh(payload);

            messages.value.push({ ...payload, self: true });
            currentInput.value = '';
            scrollToBottom();
        };

        const receivePayload = (data) => {
            if (messages.value.find(m => m.id === data.id)) return;
            messages.value.push({ ...data, self: false });
            scrollToBottom();
        };

        const formatTime = (ts) => {
            if (!ts) return '';
            const d = new Date(ts);
            return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        };

        const scrollToBottom = () => {
            nextTick(() => {
                const el = document.getElementById('msg-container');
                if (el) el.scrollTop = el.scrollHeight;
            });
        };

        const addSystemMessage = (t) => messages.value.push({ sender: 'SYS', text: t, time: Date.now(), id: Date.now() });

        return {
            roomId, myName, isJoined, isHost, currentInput, messages,
          initRoom, sendPayload, exportHostLogs, importLogs, formatTime
        };
    }
}).mount('#app');
