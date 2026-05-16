const { createApp, ref, onUnmounted } = Vue;

createApp({
    setup() {
        const activeMode = ref("SCREEN"); // SCREEN | AUDIO | SCREENSHOT
        const isRecording = ref(false);
        const recordingSeconds = ref(0);
        const errorMessage = ref("");
        const downloadAnchor = ref(null);

        let mediaRecorder = null;
        let recordedChunks = [];
        let activeStream = null;
        let timerInterval = null;

        const getStatusMessage = () => {
            if (isRecording.value) {
                return `Capturing Active pipeline stream...`;
            }
            switch (activeMode.value) {
                case 'SCREEN': return "Ready to record system viewport stream";
                case 'AUDIO': return "Ready to compile audio interface feed";
                case 'SCREENSHOT': return "Ready to flash capture visual array frame";
                default: return "Standby";
            }
        };

        const handlePrimaryAction = () => {
            if (isRecording.value) {
                stopCaptureSequence();
            } else {
                startCaptureSequence();
            }
        };

        const startCaptureSequence = async () => {
            errorMessage.value = "";
            recordedChunks = [];

            try {
                if (activeMode.value === 'SCREEN') {
                    // Trigger native screen-share capture pipeline dialog engine
                    activeStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { displaySurface: "monitor" },
                        audio: true
                    });
                    initMediaRecorder(activeStream, "video/webm");

                } else if (activeMode.value === 'AUDIO') {
                    // Trigger hardware microphone device validation process
                    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    initMediaRecorder(activeStream, "audio/webm");

                } else if (activeMode.value === 'SCREENSHOT') {
                    // Temporarily capture full resolution display frame layer to instantly snap
                    activeStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    captureScreenshotFrame(activeStream);
                }
            } catch (err) {
                console.error("Capture protocol initialization fault:", err);
                errorMessage.value = err.name === 'NotAllowedError'
                ? "Permissions rejected by operating system client."
                : `Initialization Error: ${err.message}`;
                resetSystemPointers();
            }
        };

        const initMediaRecorder = (stream, mimeType) => {
            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                compileAndDownloadOutput(mimeType);
                resetSystemPointers();
            };

            // Setup self-terminating callback hooks if user terminates stream via external browser overlay
            stream.getVideoTracks().forEach(track => {
                track.onended = () => { if (isRecording.value) stopCaptureSequence(); };
            });

            mediaRecorder.start(250); // Flush buffer blocks slices at regular 250ms interval counts
            isRecording.value = true;
            startTimerTracking();
        };

        const captureScreenshotFrame = (stream) => {
            const videoTrack = stream.getVideoTracks()[0];
            const captureVideo = document.createElement('video');

            captureVideo.srcObject = stream;
            captureVideo.muted = true;
            captureVideo.play();

            captureVideo.onloadedmetadata = () => {
                // Ensure frame sizes correspond directly with native system workspace bounds
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = captureVideo.videoWidth;
                    canvas.height = captureVideo.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(captureVideo, 0, 0, canvas.width, canvas.height);

                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        triggerDownloadLink(dataUrl, `AVERO_SNAP_${Date.now()}.png`);
                    } catch (err) {
                        errorMessage.value = "Failed to render framework matrix screenshot image canvas frame.";
                    }

                    // Instantly drop stream configurations to purge privacy light indicators
                    videoTrack.stop();
                    stream.getTracks().forEach(t => t.stop());
                }, 300); // 300ms layout engine stability layout buffer pass
            };
        };

        const stopCaptureSequence = () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        };

        const abortRecording = () => {
            if (timerInterval) clearInterval(timerInterval);
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            resetSystemPointers();
        };

        const compileAndDownloadOutput = (mimeType) => {
            if (recordedChunks.length === 0) return;

            const blob = new Blob(recordedChunks, { type: mimeType });
            const dataUrl = URL.createObjectURL(blob);
            const ext = mimeType.includes('video') ? 'webm' : 'webm';
            const prefix = activeMode.value === 'SCREEN' ? 'AVERO_REC' : 'AVERO_AUDIO';

            triggerDownloadLink(dataUrl, `${prefix}_${Date.now()}.${ext}`);

            // Late cleanup memory optimization routine loop hook
            setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
        };

        const triggerDownloadLink = (url, filename) => {
            if (downloadAnchor.value) {
                downloadAnchor.value.href = url;
                downloadAnchor.value.download = filename;
                downloadAnchor.value.click();
            }
        };

        const startTimerTracking = () => {
            recordingSeconds.value = 0;
            timerInterval = setInterval(() => {
                recordingSeconds.value++;
            }, 1000);
        };

        const resetSystemPointers = () => {
            isRecording.value = false;
            recordingSeconds.value = 0;
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            mediaRecorder = null;
            activeStream = null;
        };

        const formatTime = (totalSeconds) => {
            const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const secs = (totalSeconds % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
        };

        onUnmounted(() => {
            abortRecording();
        });

        return {
            activeMode, isRecording, recordingSeconds, errorMessage, downloadAnchor,
          getStatusMessage, handlePrimaryAction, abortRecording, formatTime
        };
    }
}).mount('#app');
