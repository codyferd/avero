/**
 * Avero Mesh Networking Engine
 * Manages PeerJS lifecycle, connections, and data broadcasting.
 */

const Mesh = {
    peer: null,
    connections: [],
    hostConn: null,
    isHost: false,

    /**
     * Initializes a Mesh Node
     * @param {string} id - The Room ID
     * @param {Object} callbacks - Hooks for UI updates
     */
    async init(id, callbacks) {
        if (this.peer) this.peer.destroy();

        // Standard STUN server for P2P traversal
        this.peer = new Peer(id, {
            config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }] }
        });

        this.peer.on('open', (peerId) => {
            this.isHost = true;
            this.connections = [];
            callbacks.onJoined(true);
            callbacks.onSystem(`Mesh Server Started: ${peerId}`);
            this._setupHostListeners(callbacks);
        });

        this.peer.on('error', (err) => {
            // If the ID is taken, we aren't the first one there; join as a guest
            if (err.type === 'unavailable-id') {
                this._joinAsGuest(id, callbacks);
            } else {
                callbacks.onSystem(`Network Error: ${err.type}`);
            }
        });
    },

    /**
     * Internal: Setup Host specific behaviors
     */
    _setupHostListeners(callbacks) {
        this.peer.on('connection', (conn) => {
            this.connections.push(conn);

            conn.on('open', () => {
                callbacks.onSystem(`Peer Connected: ${conn.peer}`);
                // Notify app.js to trigger a call if video is active
                if (callbacks.onPeerJoin) callbacks.onPeerJoin(conn.peer);
                // Trigger history and channel list sync
                callbacks.requestHistorySync(conn);
            });

            conn.on('data', (data) => {
                // The Host acts as the "Hub" - relaying messages to all other peers
                this.broadcast(data, conn.peer);
                callbacks.onMessage(data);
            });

            conn.on('close', () => {
                this.connections = this.connections.filter(c => c.peer !== conn.peer);
                callbacks.onSystem(`Peer Left: ${conn.peer}`);
            });
        });
    },

    /**
     * Internal: Setup Guest specific behaviors
     */
    _joinAsGuest(id, callbacks) {
        this.peer = new Peer(); // Guest gets a random unique ID
        this.isHost = false;

        this.peer.on('open', (myGuestId) => {
            this.hostConn = this.peer.connect(id, { reliable: true });

            this.hostConn.on('open', () => {
                callbacks.onJoined(false);
                callbacks.onSystem(`Mesh Connected to ${id}`);
            });

            this.hostConn.on('data', (data) => {
                // Route specialized data types to their specific handlers in app.js
                if (data.type === 'history') {
                    callbacks.onHistory(data.data);
                } else {
                    // Standard messages or 'channel-sync' payloads
                    callbacks.onMessage(data);
                }
            });

            this.hostConn.on('close', () => {
                callbacks.onSystem("Lost connection to Mesh Host.");
                this.leave();
            });
        });
    },

    /**
     * Broadcasts a payload to the entire mesh
     * @param {Object} payload
     * @param {string} excludePeer - Skip a specific peer (usually the sender)
     */
    broadcast(payload, excludePeer = null) {
        if (this.isHost) {
            // Host sends to every connected peer
            this.connections.forEach(conn => {
                if (conn.open && conn.peer !== excludePeer) {
                    conn.send(payload);
                }
            });
        } else if (this.hostConn && this.hostConn.open) {
            // Guest sends only to the Host for relaying
            this.hostConn.send(payload);
        }
    },

    /**
     * Disconnects and cleans up
     */
    leave() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
            this.connections = [];
            this.hostConn = null;
        }
    }
};

window.Mesh = Mesh;
