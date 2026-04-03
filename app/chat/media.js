/**
 * Avero Media Engine
 * Handles Camera/Mic access and Remote Video DOM management.
 */

const Media = {
    localStream: null,

    /**
     * Requests Camera and Microphone access
     * @returns {Promise<MediaStream>}
     */
    async startLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 360 },
                    facingMode: "user"
                },
                audio: true
            });
            return this.localStream;
        } catch (err) {
            console.error("Media Access Error:", err);
            throw new Error("Could not access camera or microphone.");
        }
    },

    /**
     * Stops all tracks in the local stream and clears the variable
     */
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    },

    /**
     * Creates a video element for a remote peer and appends it to a container
     * @param {string} peerId
     * @param {MediaStream} remoteStream
     * @param {string} containerId
     */
    addRemoteVideo(peerId, remoteStream, containerId = 'video-area') {
        const container = document.getElementById(containerId);
        if (!container || document.getElementById(`video-${peerId}`)) return;

        const videoWrap = document.createElement('div');
        videoWrap.id = `video-${peerId}`;
        videoWrap.className = "relative group rounded-xl overflow-hidden bg-black aspect-video border border-white/10";

        const video = document.createElement('video');
        video.srcObject = remoteStream;
        video.autoplay = true;
        video.playsinline = true;
        video.className = "w-full h-full object-cover";

        // Label for the peer
        const label = document.createElement('div');
        label.className = "absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-widest text-white/80";
        label.innerText = peerId.substring(0, 8);

        videoWrap.appendChild(video);
        videoWrap.appendChild(label);
        container.appendChild(videoWrap);
    },

    /**
     * Removes a video element when a peer disconnects
     * @param {string} peerId
     */
    removeRemoteVideo(peerId) {
        const el = document.getElementById(`video-${peerId}`);
        if (el) el.remove();
    },

    /**
     * Toggles a specific track type (video/audio)
     * @param {string} type - 'video' or 'audio'
     * @returns {boolean} - The new enabled state
     */
    toggleTrack(type) {
        if (!this.localStream) return false;
        const track = type === 'video'
        ? this.localStream.getVideoTracks()[0]
        : this.localStream.getAudioTracks()[0];

        if (track) {
            track.enabled = !track.enabled;
            return track.enabled;
        }
        return false;
    }
};

window.Media = Media;
