/**
 * Avero Send // Network Pipeline Core Engine
 * Decentralized Full Mesh P2P Architecture
 */
(() => {
    const { createApp, ref } = Vue;

    createApp({
        setup() {
            const roomCodeInput = ref("");
            const localPeerId = ref("");
            const textBuffer = ref("");
            const isNodeActive = ref(false);
            const isDragging = ref(false);
            const activeConnections = ref([]);
            const transferHistory = ref([]);
            
            let peerInstance = null;
            let currentIdIndex = 0;
            let roomBaseName = "";
            const roomPrefix = "AVERO_SEND_RM_";

            /**
             * INITIALIZE DECENTRALIZED MESH VECTOR PROBING
             */
            const initMesh = () => {
                const cleanSlug = roomCodeInput.value.trim().toUpperCase().replace(/[\s-]/g, "_");
                if (!cleanSlug) return;

                roomBaseName = roomPrefix + cleanSlug;
                currentIdIndex = 0;
                tryConnect();
            };

            const tryConnect = () => {
                const attemptId = `${roomBaseName}_${currentIdIndex}`;
                peerInstance = new Peer(attemptId);

                peerInstance.on("open", (id) => {
                    isNodeActive.value = true;
                    localPeerId.value = id;

                    // 1. Listen for connection vectors from future nodes entering this track
                    peerInstance.on("connection", (c) => setupConnectionListeners(c));

                    // 2. Loop backwards and bridge pipelines to all earlier active instances
                    const maxSearch = Math.max(currentIdIndex + 5, 15);
                    for (let i = 0; i < maxSearch; i++) {
                        if (i === currentIdIndex) continue;
                        const targetId = `${roomBaseName}_${i}`;
                        const outboundLink = peerInstance.connect(targetId);
                        setupConnectionListeners(outboundLink);
                    }
                });

                peerInstance.on("error", (err) => {
                    // Unique ID allocation check: if slot is claimed, step up index index
                    if (err.type === "unavailable-id") {
                        peerInstance.destroy();
                        currentIdIndex++;
                        tryConnect();
                    } 
                    // Safely ignore lookup responses for inactive backward nodes
                    else if (err.type === "peer-unavailable") {
                        // Quietly intercept to prevent log pollution
                    } 
                    else {
                        alert(`Network Protocol Exception: ${err.type}`);
                        disconnectPipeline();
                    }
                });
            };

            /**
             * CONNECTIONS TOPOLOGY REGISTRY
             */
            const setupConnectionListeners = (conn) => {
                // Prevent duplicate listener bounds
                if (activeConnections.value.some(c => c.peer === conn.peer)) return;

                conn.on("open", () => {
                    activeConnections.value.push(conn);
                    
                    conn.on("data", (dataPackage) => {
                        if (dataPackage.targetRoomId !== roomCodeInput.value.trim().toUpperCase()) return;
                        processIncomingData(dataPackage, conn.peer);
                    });

                    conn.on("close", () => removeMeshNode(conn.peer));
                    conn.on("error", () => removeMeshNode(conn.peer));
                });
            };

            const removeMeshNode = (peerId) => {
                activeConnections.value = activeConnections.value.filter(c => c.peer !== peerId);
            };

            const disconnectPipeline = () => {
                if (peerInstance) peerInstance.destroy();
                activeConnections.value = [];
                isNodeActive.value = false;
                localPeerId.value = "";
                currentIdIndex = 0;
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
             * PROCESSING & PROPAGATION
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
            };

            /**
             * LOGISTICAL UI SYSTEM CONVERSIONS
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
                roomCodeInput, localPeerId, textBuffer, isNodeActive, isDragging, activeConnections, transferHistory,
                initMesh, disconnectPipeline, dispatchTextBuffer, handleFileSelection, handleDrop, extractClipboardData, copyToClipboard
            };
        }
    }).mount("#app");
})();
