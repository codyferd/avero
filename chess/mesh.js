/**
 * Avero Mesh Protocol - Chess Module
 * Handles P2P connectivity, turn synchronization, and role assignment.
 */
const Mesh = {
    peer: null,
    conn: null,
    idPrefix: 'avero-chess-',

    // Core Mesh State
    state: {
        isMesh: false,
        myColor: 'w', // Default to white
        status: ''
    },

    /**
     * Initialize a Host Peer
     * @param {string} roomId - User defined room name
     * @param {Object} callbacks - Functions to update the Vue UI
     */
    initHost(roomId, callbacks) {
        const fullId = this.idPrefix + roomId.toLowerCase().replace(/\s/g, '-');
        this.peer = new Peer(fullId);

        this.peer.on('open', (id) => {
            this.state.isMesh = true;
            this.state.myColor = 'w';
            callbacks.onStatus("Server live. Waiting for opponent...");
        });

        this.peer.on('connection', (connection) => {
            this.conn = connection;
            this.setupListeners(callbacks);
            // Notify the joiner they are Black
            this.conn.on('open', () => {
                this.conn.send({ type: 'init', color: 'b' });
                callbacks.onStarted();
                callbacks.onStatus("Opponent joined. Game started.");
            });
        });

        this.peer.on('error', (err) => {
            callbacks.onStatus("Error: " + err.type);
            console.error("PeerJS Error:", err);
        });
    },

    /**
     * Connect to an existing Host Peer
     */
    initJoin(roomId, callbacks) {
        const targetId = this.idPrefix + roomId.toLowerCase().replace(/\s/g, '-');
        this.peer = new Peer(); // Joiners get a random ID

        this.peer.on('open', () => {
            this.conn = this.peer.connect(targetId);
            this.setupListeners(callbacks);

            this.conn.on('open', () => {
                this.state.isMesh = true;
                this.state.myColor = 'b';
                callbacks.onStarted();
                callbacks.onStatus("Connected to mesh.");
            });
        });

        this.peer.on('error', (err) => {
            callbacks.onStatus("Could not find room.");
        });
    },

    /**
     * Shared Data Listeners
     */
    setupListeners(callbacks) {
        this.conn.on('data', (data) => {
            switch (data.type) {
                case 'init':
                    this.state.myColor = data.color;
                    break;
                case 'move':
                    // Pass the move data to the Chess engine via callback
                    callbacks.onRemoteMove(data.move);
                    break;
                case 'chat':
                    // Future proofing for Avero Chat integration
                    console.log("Mesh Message:", data.text);
                    break;
            }
        });

        this.conn.on('close', () => {
            callbacks.onStatus("Opponent disconnected.");
            this.state.isMesh = false;
        });
    },

    /**
     * Send a move to the connected Peer
     */
    sendMove(moveData) {
        if (this.conn && this.conn.open) {
            this.conn.send({
                type: 'move',
                move: moveData
            });
        }
    }
};
