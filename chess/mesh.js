/**
 * Avero Mesh Protocol - Chess Module
 * Robust P2P synchronization with strict 2-player enforcement.
 */
const Mesh = {
    peer: null,
    conn: null,
    idPrefix: 'avero-chess-',

    state: {
        isMesh: false,
        myColor: 'w',
        status: ''
    },

    /**
     * Initialize a Host Peer
     */
    initHost(roomId, callbacks) {
        this.cleanup();
        const fullId = this.idPrefix + roomId.toLowerCase().replace(/\s/g, '-');
        this.peer = new Peer(fullId);

        this.peer.on('open', () => {
            this.state.isMesh = true;
            this.state.myColor = 'w';
            callbacks.onStatus("Room Live. Waiting for opponent...");
        });

        this.peer.on('connection', (connection) => {
            // STRICT ENFORCEMENT: If we already have a live connection, kick the newcomer
            if (this.conn && this.conn.open) {
                connection.on('open', () => {
                    connection.send({ type: 'kick', message: 'Room is full (Max 2)' });
                    setTimeout(() => connection.close(), 500);
                });
                return;
            }

            this.conn = connection;
            this.setupListeners(callbacks);

            this.conn.on('open', () => {
                this.conn.send({ type: 'init', color: 'b' });
                callbacks.onStarted();
                callbacks.onStatus("Opponent Joined.");
            });
        });

        this.peer.on('error', (err) => {
            const msg = err.type === 'unavailable-id' ? "Room Name Taken" : `Mesh Error: ${err.type}`;
            callbacks.onStatus(msg);
        });
    },

    /**
     * Connect to an existing Host
     */
    initJoin(roomId, callbacks) {
        this.cleanup();
        const targetId = this.idPrefix + roomId.toLowerCase().replace(/\s/g, '-');
        this.peer = new Peer(); // Random ID for joiner

        this.peer.on('open', () => {
            this.conn = this.peer.connect(targetId, {
                reliable: true // Ensure move data isn't dropped
            });
            this.setupListeners(callbacks);
        });

        this.peer.on('error', (err) => {
            callbacks.onStatus("Room not found or connection failed.");
        });
    },

    /**
     * Shared Data Listeners
     */
    setupListeners(callbacks) {
        this.conn.on('data', (data) => {
            console.log("Mesh Data:", data.type); // Debugging

            switch (data.type) {
                case 'init':
                    this.state.isMesh = true;
                    this.state.myColor = data.color;
                    callbacks.onStarted();
                    callbacks.onStatus("Connected to Mesh.");
                    break;

                case 'kick':
                    callbacks.onKick(data.message);
                    this.cleanup();
                    break;

                case 'move':
                    callbacks.onRemoteMove(data.move);
                    break;

                case 'status-sync':
                    callbacks.onStatus(data.text);
                    break;
            }
        });

        this.conn.on('close', () => {
            callbacks.onStatus("Opponent disconnected.");
            this.state.isMesh = false;
            this.conn = null;
        });

        this.conn.on('error', () => {
            callbacks.onStatus("Mesh connection lost.");
            this.cleanup();
        });
    },

    /**
     * Send move to Peer
     */
    sendMove(moveData) {
        if (this.conn && this.conn.open) {
            this.conn.send({
                type: 'move',
                move: moveData
            });
        }
    },

    /**
     * Reset and close all P2P activity
     */
    cleanup() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.state.isMesh = false;
    }
};
