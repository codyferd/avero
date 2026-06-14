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
        let connections = []; 
        let hostConn = null;  

        const init = () => {
            if (!roomId.value) return alert("Enter a Room ID");

            peer = new Peer(roomId.value);

            peer.on('open', () => {
                isJoined.value = true;
                isHost.value = true;
                
                peer.on('connection', (c) => handleConnection(c));
                updateUsers();
            });

            peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    peer.destroy(); 
                    peer = new Peer();
                    
                    peer.on('open', () => {
                        hostConn = peer.connect(roomId.value, {
                            metadata: { username: username.value } 
                        });
                        
                        hostConn.on('open', () => {
                            isJoined.value = true;
                        });
                        
                        hostConn.on('data', (d) => handleData(d));
                        
                        hostConn.on('close', () => {
                            alert("Disconnected from host room.");
                            isJoined.value = false;
                        });
                    });
                }
            });
        };

        const handleConnection = (c) => {
            c.on('open', () => {
                connections.push(c);
                
                c.username = c.metadata?.username || `Guest_${c.peer.slice(0,4)}`;
                
                c.on('data', (d) => handleData(d, c.peer));
                
                c.on('close', () => {
                    connections = connections.filter(x => x.peer !== c.peer);
                    updateUsers();
                });
                
                updateUsers();
            });
        };

        const handleData = (d, senderPeerId) => {
            if (d.type === 'msg' || d.type === 'image') {
                messages.value.push(d.payload);
                
                if (isHost.value) {
                    broadcast(d, senderPeerId);
                }
            } 
            else if (d.type === 'user-update') {
                onlineUsers.value = d.users;
            }
            else if (d.type === 'name-change') {
                if (isHost.value) {
                    const target = connections.find(c => c.peer === senderPeerId);
                    if (target) target.username = d.username;
                    updateUsers();
                }
            }
        };

        const broadcast = (data, excludePeerId) => {
            connections.forEach(c => {
                if (c.peer !== excludePeerId && c.open) {
                    c.send(data);
                }
            });
        };

        const updateUsers = () => {
            if (isHost.value) {
                onlineUsers.value = [username.value, ...connections.map(c => c.username)];
                
                // FIX: Broadcast the updated structural array down to all connected peers
                const data = { type: 'user-update', users: onlineUsers.value };
                broadcast(data);
            }
        };

        const broadcastUserUpdate = () => {
            if (!isJoined.value) return;
            
            if (isHost.value) {
                updateUsers();
            } else if (hostConn && hostConn.open) {
                hostConn.send({ type: 'name-change', username: username.value });
            }
        };

        const send = (payload = { text: input.value, type: 'msg' }) => {
            if (!payload.text && !payload.image) return;

            const msg = {
                sender: username.value,
                id: Date.now(),
                ...payload
            };

            messages.value.push({ ...msg, self: true });

            const data = { type: payload.type, payload: msg };

            if (isHost.value) {
                broadcast(data);
            } else if (hostConn && hostConn.open) {
                hostConn.send(data);
            }

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
            const blob = new Blob([JSON.stringify(textOnly, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `chat_export_${Date.now()}.json`;
            a.click();
        };

        return {
            roomId, username, input, messages, onlineUsers, isJoined, isHost,
            init, send, sendImage, exportChat, broadcastUserUpdate, importChat
        };
    }
}).mount('#app');
