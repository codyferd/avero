const { createApp, ref, nextTick } = Vue;

createApp({
    setup() {
        const mediaUrl = ref(null);
        const fileName = ref("");
        const fileCategory = ref("");
        const rawType = ref("");
        const threeContainer = ref(null);
        const fileInput = ref(null); // 👈 Added template reference hook

        const processFile = (file) => {
            if (!file) return;

            // Wipe out existing Three.js scene graphics if present
            if (window.Avero3DEngine) {
                window.Avero3DEngine.destroy();
            }
            if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value);

            fileName.value = file.name;
            rawType.value = file.type || "application/octet-stream";

            const extension = file.name.split('.').pop().toLowerCase();

            if (file.type.startsWith('image/')) {
                fileCategory.value = "IMAGE";
            } else if (file.type.startsWith('video/')) {
                fileCategory.value = "VIDEO";
            } else if (file.type.startsWith('audio/')) {
                fileCategory.value = "AUDIO";
            } else if (extension === 'gltf' || extension === 'glb') {
                fileCategory.value = "3D";
                rawType.value = `model/${extension}`;
            } else {
                fileCategory.value = "UNKNOWN";
            }

            mediaUrl.value = URL.createObjectURL(file);

            // If 3D, wait for DOM layout and paint execution cycles
            if (fileCategory.value === "3D") {
                nextTick(() => {
                    // Micro-timeout ensures viewport styles have painted dimensions > 0px
                    setTimeout(() => {
                        if (window.Avero3DEngine && threeContainer.value) {
                            window.Avero3DEngine.init(threeContainer.value, mediaUrl.value);

                            // Explicitly force a layout recalculation pass right after init
                            if (window.Avero3DEngine.resizeHandler) {
                                window.Avero3DEngine.resizeHandler();
                            }
                        }
                    }, 50);
                });
            }
        };

        const handleFile = (e) => processFile(e.target.files[0]);

        const handleDrop = (e) => {
            const file = e.dataTransfer.files[0];
            processFile(file);
        };

        const resetPlayer = () => {
            if (window.Avero3DEngine) window.Avero3DEngine.destroy();
            if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value);

            // 👈 The Fix: Purge the browser-level input buffer state
            if (fileInput.value) {
                fileInput.value.value = "";
            }

            mediaUrl.value = null;
            fileName.value = "";
            fileCategory.value = "";
            rawType.value = "";
        };

        return {
            mediaUrl, fileName, fileCategory, rawType, threeContainer, fileInput,
            handleFile, handleDrop, resetPlayer
        };
    }
}).mount('#app');

