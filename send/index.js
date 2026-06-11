/**
 * Avero Send // Network Pipeline Core Engine
 * True Split-Role Peer Mesh (No Collisions)
 */
(() => {
    const { createApp, ref } = Vue;

    createApp({
        setup() {
            const roomCodeInput = ref("");
            const localPeerId = ref("");
            const nodeRole = ref(""); // "HOST" or "GUEST"
            const textBuffer = ref("");
            const isNodeActive = ref(false);
            const isDragging = ref(false);
            const activeConnections = ref([]);
            const transferHistory = ref([]);
            
            let peerInstance = null;
            const roomPrefix = "AVERO_SEND_RM_";

            /**
             * ROLE METHOD A: ESTABLISH AS THE CENTRAL WORKSPACE HOST
             */
            const establishAsHost = () => {
                const cleanSlug = roomCodeInput.value.trim().toUpperCase().replace(/[\s-]/g, "_");
                if (!cleanSlug) return;

                nodeRole.value = "HOST";
                // Register using the absolute Room Name directly as the unique connection broker address
                const absoluteHostRoomAddress = roomPrefix + cleanSlug;
                localPeerId.value = absoluteHostRoomAddress;

                peerInstance = new Peer(absoluteHostRoomAddress);

                peerInstance.on("open", (id) => {
                    isNodeActive.value = true;
                });

                peerInstance.on("connection", (inboundGuestConnection) => {
                    setupConnectionListeners(inboundGuestConnection);
                });

                peerInstance.on("error", (err) => {
                    if (err.type === "unavailable-id") {
                        alert("Hosting Blocked: That room code is currently active. Try a different name or Join instead.");
                    } else {
                        alert(`Network Protocol Exception: ${err.type}`);
                    }
                    disconnectPipeline();
                });
            };

            /**
             * ROLE METHOD B: CONNECT AS A FLOATING RE-BROADCAST GUEST NODE
             */
            const establishAsGuest = () => {
                const cleanSlug = roomCodeInput.value.trim().toUpperCase().replace(/[\s-]/g, "_");
                if (!cleanSlug) return;

                nodeRole.value = "GUEST";
                // Generate a randomized unique client token string so we never encounter peer-unavailable
                localPeerId.value = "NODE_" + Math.random().toString(36).substring(2, 7).toUpperCase();
                
                peerInstance = new Peer(localPeerId.value);

                peerInstance.on("open", () => {
                    isNodeActive.value = true;
                    
                    const targetHostAddress = roomPrefix + cleanSlug;
                    const outboundLink = peerInstance.connect(targetHostAddress);
                    setupConnectionListeners(outboundLink);
                });

                peerInstance.on("connection", (interGuestLink) => {
                    setupConnectionListeners(interGuestLink);
                });

                peerInstance.on("error", (err) => {
                    if (err.type === "peer-not-found") {
                        alert("Routing Error: Target Room Code does not exist or has no active Host online.");
                    } else {
                        alert(`Network Protocol Exception: ${err.type}`);
                    }
                    disconnectPipeline();
                });
            };

            /**
             * INTER-MESH TOPOLOGY ROUTER LISTENERS
             */
            const setupConnectionListeners = (conn) => {
                if (activeConnections.value.some(c => c.peer === conn.peer)) return;

                conn.on("open", () => {
                    activeConnections.value.push(conn);
                    
                    // Host execution step: automatically introduce the new client to all existing peers in the room
                    if (nodeRole.value === "HOST") {
                        const peerRosterList = activeConnections.value
                            .map(c => c.peer)
                            .filter(id => id !== conn.peer);

                        if (peerRosterList.length > 0) {
                            conn.send({
                                systemInstruction: "MESH_INTRODUCE_PEERS",
                                targetRoomId: roomCodeInput.value.trim().toUpperCase(),
                                peers: peerRosterList
                            });
                        }
                    }
                });

                conn.on("data", (dataPackage) => {
                    if (dataPackage.targetRoomId !== roomCodeInput.value.trim().toUpperCase()) return;

                    // Intercept automatic network handshakes passed down by the system mesh introduction engine
                    if (dataPackage.systemInstruction === "MESH_INTRODUCE_PEERS" && nodeRole.value === "GUEST") {
                        dataPackage.peers.forEach(remotePeerId => {
                            if (remotePeerId !== localPeerId.value && !activeConnections.value.some(c => c.peer === remotePeerId)) {
                                const meshBridgeLink = peerInstance.connect(remotePeerId);
                                setupConnectionListeners(meshBridgeLink);
                            }
                        });
                        return;
                    }

                    processIncomingData(dataPackage, conn.peer);
                });

                conn.on("close", () => removeMeshNode(conn.peer));
                conn.on("error", () => removeMeshNode(conn.peer));
            };

            const removeMeshNode = (peerId) => {
                activeConnections.value = activeConnections.value.filter(c => c.peer !== peerId);
            };

            const disconnectPipeline = () => {
                if (peerInstance) peerInstance.destroy();
                activeConnections.value = [];
                isNodeActive.value = false;
                localPeerId.value = "";
                nodeRole.value = "";
            };

            /**
             * MESH PIPELINE TRANSMISSION BROADCAST ENGINE
             */
            const relayToAllMeshNodes = (payloadFrame, excludePeerId = null) => {
                activeConnections.value.forEach(conn => {
                    if (conn.open && conn.peer !== excludePeerId) {
                        conn.send({
                            ...payloadFrame,
                            targetRoomId: roomCodeInput.value.trim().toUpperCase(),
                            forwardedFrom: localPeerId.value
                        });
                    }
                });
            };

            const dispatchTextBuffer = () => {
                const rawMessage = textBuffer.value.trim();
                if (!rawMessage) return;

                const packetFrame = {
                    id: "msg_" + Date.now() + Math.random().toString(36).substring(2, 5),
                    type: "text",
                    name: rawMessage.length > 40 ? rawMessage.substring(0, 40) + "..." : rawMessage,
                    payload: rawMessage,
                    meta: `${rawMessage.length} Chars`
                };

                relayToAllMeshNodes(packetFrame);
                
                transferHistory.value.unshift({
                    id: packetFrame.id,
                    type: "text",
                    direction: "out",
                    peer: "Room Mesh",
                    name: packetFrame.name,
                    payload: packetFrame.payload,
                    meta: packetFrame.meta
                });
                textBuffer.value = "";
            };

            const pipelineFileArray = async (files) => {
                if (!files || files.length === 0) return;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const cleanFileName = file.webkitRelativePath || file.name;

                    const fileReader = new FileReader();
                    fileReader.onload = (event) => {
                        const bufferData = event.target.result;
                        
                        const packetFrame = {
                            id: "file_" + Date.now() + "_" + i,
                            type: "file",
                            name: cleanFileName,
                            payload: bufferData,
                            mime: file.type || "application/octet-stream",
                            meta: formatBytes(file.size)
                        };

                        relayToAllMeshNodes(packetFrame);
                        
                        transferHistory.value.unshift({
                            id: packetFrame.id,
                            type: "file",
                            direction: "out",
                            peer: "Room Mesh",
                            name: packetFrame.name,
                            meta: packetFrame.meta,
                            url: URL.createObjectURL(new Blob([bufferData], { type: packetFrame.mime }))
                        });
                    };
                    fileReader.readAsArrayBuffer(file);
                }
            };

            /**
             * REAL-TIME DATA LOG EXTRACTION & PROPAGATION VIA CHANNELS
             */
            const processIncomingData = (frame, incomingSourcePeer) => {
                if (transferHistory.value.some(h => h.id === frame.id)) return;

                if (frame.type === "text") {
                    transferHistory.value.unshift({
                        id: frame.id,
                        type: "text",
                        direction: "in",
                        peer: incomingSourcePeer,
                        name: frame.name,
                        payload: frame.payload,
                        meta: frame.meta
                    });
                } else if (frame.type === "file") {
                    const generatedUrl = URL.createObjectURL(new Blob([frame.payload], { type: frame.mime }));
                    transferHistory.value.unshift({
                        id: frame.id,
                        type: "file",
                        direction: "in",
                        peer: incomingSourcePeer,
                        name: frame.name,
                        meta: frame.meta,
                        url: generatedUrl
                    });
                }

                // Automatic Mesh Synchronization: propagate the transmission packet immediately to every other open line
                relayToAllMeshNodes(frame, incomingSourcePeer);
            };

            /**
             * LOGISTICAL SYSTEM CONVERSIONS
             */
            const handleFileSelection = (e) => {
                pipelineFileArray(e.target.files);
                e.target.value = "";
            };

            const handleDrop = (e) => {
                isDragging.value = false;
                if (isNodeActive.value && e.dataTransfer.files) pipelineFileArray(e.dataTransfer.files);
            };

            const extractClipboardData = async () => {
                try {
                    const str = await navigator.clipboard.readText();
                    if (str) textBuffer.value = str;
                } catch (e) {
                    alert("System Exception: Clipboard read permission denied.");
                }
            };

            const formatBytes = (b) => {
                if (!b) return "0 B";
                const k = 1024;
                const sizes = ["B", "KB", "MB", "GB"];
                const i = Math.floor(Math.log(b) / Math.log(k));
                return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
            };

            const copyToClipboard = (str, e) => {
                navigator.clipboard.writeText(str).then(() => {
                    const btn = e.target;
                    const orig = btn.innerText;
                    btn.innerText = "COPIED";
                    setTimeout(() => btn.innerText = orig, 800);
                });
            };

            return {
                roomCodeInput, localPeerId, nodeRole, textBuffer, isNodeActive, isDragging, activeConnections, transferHistory,
                establishAsHost, establishAsGuest, disconnectPipeline, dispatchTextBuffer, handleFileSelection, handleDrop, extractClipboardData, copyToClipboard
            };
        }
    }).mount("#app");
})();