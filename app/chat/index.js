const { createApp, ref, nextTick, watch, computed } = Vue;

createApp({
    setup() {
        // --- REACTIVE STATE ---
        const roomId = ref('');
        const myName = ref('User_' + Math.floor(Math.random() * 999));
        const isJoined = ref(false);
        const isHost = ref(false);
        const showSidebar = ref(false);
        const currentInput = ref('');
        const messages = ref([]);
        const stream = ref(null);
        const isMuted = ref(false);

        // --- SUBCHAT STATE ---
        const subchats = ref(['GENERAL']);
        const currentSubchat = ref('GENERAL');

        // --- COMPUTED ---
        // Filters messages so you only see those belonging to the active subchat or system alerts
        const filteredMessages = computed(() => {
            return messages.value.filter(m =>
            m.subchatId === currentSubchat.value ||
            m.sender === 'SYS'
            );
        });

        // --- WATCHERS ---
        watch(roomId, (val) => {
            roomId.value = Utils.cleanRoomId(val);
        });

        // --- CORE MESH ACTIONS ---
        const initRoom = () => {
            if (!roomId.value || isJoined.value) return;

            Mesh.init(roomId.value, {
                onJoined: (hostStatus) => {
                    isJoined.value = true;
                    isHost.value = hostStatus;

                    Mesh.peer.on('call', (call) => {
                        call.answer(stream.value);
                        handleCall(call);
                    });
                },
                onSystem: (text) => {
                    messages.value.push(Utils.createSysMsg(text));
                    scrollToBottom();
                },
                onMessage: (data) => {
                    // Handle channel list synchronization
                    if (data.type === 'channel-sync') {
                        data.channels.forEach(c => {
                            if (!subchats.value.includes(c)) subchats.value.push(c);
                        });
                            return;
                    }

                    if (messages.value.find(m => m.id === data.id)) return;
                    messages.value.push({ ...data, self: false });
                    scrollToBottom();
                },
                onHistory: (history) => {
                    mergeMessages(history);
                    scrollToBottom();
                },
                requestHistorySync: (conn) => {
                    // Send text history and the current list of subchats to the new peer
                    const history = messages.value.filter(m => !m.image);
                    conn.send({ type: 'history', data: history });
                    conn.send({ type: 'channel-sync', channels: subchats.value });
                },
                onPeerJoin: (peerId) => {
                    if (stream.value) {
                        const call = Mesh.peer.call(peerId, stream.value);
                        handleCall(call);
                    }
                }
            });
        };

        const sendPayload = () => {
            if (!currentInput.value || !isJoined.value) return;

            const payload = {
                sender: myName.value,
                text: currentInput.value,
                subchatId: currentSubchat.value, // Tag message with current channel
                time: Date.now(),
          id: Utils.generateId()
            };

            Mesh.broadcast(payload);
            messages.value.push({ ...payload, self: true });
            currentInput.value = '';
            scrollToBottom();
        };

        const sendImage = async (event) => {
            const file = event.target.files[0];
            if (!file || !isJoined.value) return;

            try {
                const base64 = await Utils.fileToBase64(file);
                const payload = {
                    sender: myName.value,
          image: base64,
          subchatId: currentSubchat.value,
          time: Date.now(),
          id: Utils.generateId()
                };

                Mesh.broadcast(payload);
                messages.value.push({ ...payload, self: true });
                scrollToBottom();
            } catch (err) {
                messages.value.push(Utils.createSysMsg("Failed to process image."));
            }
        };

        // --- SUBCHAT ACTIONS ---
        const createSubchat = () => {
            const name = prompt("Enter subchat name:")?.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (name && !subchats.value.includes(name)) {
                subchats.value.push(name);
                currentSubchat.value = name;
                // Tell the rest of the mesh about the new channel
                Mesh.broadcast({ type: 'channel-sync', channels: subchats.value });
                messages.value.push(Utils.createSysMsg(`Channel #${name} created.`));
            }
        };

        // --- STORAGE & MERGE ACTIONS ---
        const mergeMessages = (newBatch) => {
            const map = new Map();
            messages.value.forEach(m => map.set(m.id, m));
            newBatch.forEach(m => {
                map.set(m.id, m);
                // Ensure subchats mentioned in history are added to the list
                if (m.subchatId && !subchats.value.includes(m.subchatId)) {
                    subchats.value.push(m.subchatId);
                }
            });
            messages.value = Array.from(map.values()).sort((a, b) => a.time - b.time);
        };

        const importLogs = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        mergeMessages(imported);
                        if (isHost.value) {
                            Mesh.broadcast({ type: 'history', data: messages.value.filter(m => !m.image) });
                            Mesh.broadcast({ type: 'channel-sync', channels: subchats.value });
                        }
                        messages.value.push(Utils.createSysMsg("History merged into current session."));
                        scrollToBottom();
                    }
                } catch (err) {
                    alert("Failed to parse Avero Mesh logs.");
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        };

        // --- MEDIA ACTIONS ---
        const toggleVideo = async () => {
            if (stream.value) {
                Media.stopLocalStream();
                stream.value = null;
            } else {
                try {
                    stream.value = await Media.startLocalStream();
                    const targets = isHost.value ? Mesh.connections : (Mesh.hostConn ? [Mesh.hostConn] : []);
                    targets.forEach(conn => {
                        const targetPeer = conn.peer || conn;
                        if (targetPeer) {
                            const call = Mesh.peer.call(targetPeer, stream.value);
                            handleCall(call);
                        }
                    });
                } catch (err) {
                    messages.value.push(Utils.createSysMsg(err.message));
                }
            }
        };

        const handleCall = (call) => {
            call.on('stream', (remoteStream) => {
                Media.addRemoteVideo(call.peer, remoteStream);
            });
            call.on('close', () => {
                Media.removeRemoteVideo(call.peer);
            });
        };

        // --- UI HELPERS ---
        const scrollToBottom = () => {
            nextTick(() => {
                const el = document.getElementById('msg-container');
                if (el) el.scrollTop = el.scrollHeight;
            });
        };

        const saveChat = () => {
            Utils.exportJsonLogs(messages.value, roomId.value);
        };

        return {
            roomId, myName, isJoined, isHost, showSidebar,
            currentInput, messages, stream, isMuted,
            subchats, currentSubchat, filteredMessages, // Subchat exports
            initRoom, sendPayload, sendImage, importLogs, toggleVideo,
            createSubchat, saveChat, formatTime: Utils.formatTime
        };
    }
}).mount('#app');
