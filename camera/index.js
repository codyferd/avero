const { createApp, ref, onMounted, onUnmounted } = Vue;

createApp({
    setup() {
        const videoElement = ref(null);
        const downloadAnchor = ref(null);
        const streamActive = ref(false);
        const errorMessage = ref("");
        const isFrontCamera = ref(true);
        const hasMultipleCameras = ref(false);

        let localStream = null;

        // Scans the client system hardware for multiple optics configurations (Front vs Back)
        const checkDeviceCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                hasMultipleCameras.value = videoDevices.length > 1;
            } catch (err) {
                console.warn("Failed to discover complete device hardware matrix map:", err);
            }
        };

        const initCamera = async () => {
            stopCurrentStream();
            errorMessage.value = "";

            // Dynamic camera resolution constraints
            const constraints = {
                video: {
                    facingMode: isFrontCamera.value ? "user" : "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            try {
                localStream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoElement.value) {
                    videoElement.value.srcObject = localStream;
                    streamActive.value = true;
                }
                // Refresh component camera list after initial authorization access clearance
                await checkDeviceCameras();
            } catch (err) {
                streamActive.value = false;
                if (err.name === 'NotAllowedError') {
                    errorMessage.value = "Access Denied. Please enable camera permissions.";
                } else {
                    errorMessage.value = `Initialization Error: ${err.message}`;
                }
            }
        };

        const flipCamera = () => {
            isFrontCamera.value = !isFrontCamera.value;
            initCamera();
        };

        const capturePhoto = () => {
            if (!streamActive.value || !videoElement.value) return;

            // Generate an isolated, dynamic canvas rendering context pipeline element
            const canvas = document.createElement('canvas');
            const video = videoElement.value;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');

            // Handle mirror transforms inside canvas spatial buffers for front facing output snapshots
            if (isFrontCamera.value) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Export tracking blob formatting string URL
            try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

                // Route image down to structural auto download anchor hook
                if (downloadAnchor.value) {
                    downloadAnchor.value.href = dataUrl;
                    downloadAnchor.value.download = `AVERO_CAPTURE_${Date.now()}.jpg`;
                    downloadAnchor.value.click();
                }
            } catch (err) {
                console.error("Frame capture buffer render failure process tracking chain loop broken:", err);
            }
        };

        const stopCurrentStream = () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
            if (videoElement.value) {
                videoElement.value.srcObject = null;
            }
            streamActive.value = false;
        };

        onMounted(() => {
            initCamera();
        });

        onUnmounted(() => {
            stopCurrentStream();
        });

        return {
            videoElement, downloadAnchor, streamActive, errorMessage,
          isFrontCamera, hasMultipleCameras,
          initCamera, flipCamera, capturePhoto
        };
    }
}).mount('#app');
