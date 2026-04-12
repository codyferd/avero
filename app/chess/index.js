const { createApp, ref, reactive, onMounted, computed } = Vue;

createApp({
    setup() {
        const game = new Chess();

        // --- UI & LOBBY STATE ---
        const gameStarted = ref(false);
        const lobbyId = ref('');
        const meshStatus = ref('');
        const connectionMode = ref('Local');
        const gameOverMessage = ref('');

        // --- BOARD STATE ---
        const boardState = ref([]);
        const turn = ref('w');
        const flipped = ref(false);
        const moveHistory = ref([]);
        const captured = reactive({ w: [], b: [] });
        const selected = ref(null);
        const lastMove = ref({ from: null, to: null });

        // --- HELPERS ---
        const syncState = () => {
            boardState.value = game.board();
            turn.value = game.turn();
            moveHistory.value = game.history({ verbose: true });

            // Calculate captured pieces
            const history = game.history({ verbose: true });
            captured.w = []; captured.b = [];
            history.forEach(m => {
                if (m.captured) {
                    const color = m.color === 'w' ? 'b' : 'w';
                    captured[color].push(m.captured);
                }
            });

            if (game.game_over()) {
                if (game.in_checkmate()) gameOverMessage.value = `Checkmate! ${turn.value === 'w' ? 'Black' : 'White'} wins.`;
                else if (game.in_draw()) gameOverMessage.value = "Draw!";
                else gameOverMessage.value = "Game Over";
            }
        };
        const formatLobbyId = () => {
            // 1. Replace spaces with hyphens
            // 2. Remove any character that isn't a-z, 0-9, or -
            // 3. Force lowercase
            lobbyId.value = lobbyId.value
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase();
        };
        // --- BUTTON ACTIONS ---
        const initLocalGame = () => {
            connectionMode.value = 'Local PvP';
            gameStarted.value = true;
            syncState();
        };

        const hostMeshGame = () => {
            if (!lobbyId.value) return meshStatus.value = "Enter a room name";
            connectionMode.value = 'Mesh (Host)';

            Mesh.initHost(lobbyId.value, {
                onStatus: (s) => meshStatus.value = s,
                          onStarted: () => gameStarted.value = true,
                          onRemoteMove: (m) => {
                              game.move(m);
                              lastMove.value = m;
                              syncState();
                          }
            });
        };

        const joinMeshGame = () => {
            if (!lobbyId.value) return meshStatus.value = "Enter room name";
            connectionMode.value = 'Mesh (Peer)';

            Mesh.initJoin(lobbyId.value, {
                onStatus: (s) => meshStatus.value = s,
                          onStarted: () => {
                              gameStarted.value = true;
                              flipped.value = true; // Black perspective
                          },
                          onRemoteMove: (m) => {
                              game.move(m);
                              lastMove.value = m;
                              syncState();
                          }
            });
        };

        const resetGame = () => {
            game.reset();
            gameStarted.value = false;
            gameOverMessage.value = '';
            meshStatus.value = '';
            flipped.value = false;
            lastMove.value = { from: null, to: null };
            if (Mesh.peer) Mesh.peer.destroy();
        };

            // --- INTERACTION ---
            const handleSquareClick = (r, c) => {
                // If Mesh, prevent moving opponent's pieces
                if (Mesh.state.isMesh && game.turn() !== Mesh.state.myColor) return;

                const square = String.fromCharCode(97 + c) + (8 - r);

                if (selected.value) {
                    const moveObj = { from: selected.value, to: square, promotion: 'q' };
                    const move = game.move(moveObj);

                    if (move) {
                        if (Mesh.state.isMesh) Mesh.sendMove({ from: move.from, to: move.to });
                        lastMove.value = { from: move.from, to: move.to };
                        syncState();
                    }
                    selected.value = null;
                } else {
                    const piece = game.get(square);
                    if (piece && piece.color === game.turn()) {
                        selected.value = square;
                    }
                }
            };

            // --- UI HELPERS ---
            const isSelected = (r, c) => selected.value === (String.fromCharCode(97 + c) + (8 - r));
            const isLastMove = (r, c) => {
                const sq = String.fromCharCode(97 + c) + (8 - r);
                return lastMove.value.from === sq || lastMove.value.to === sq;
            };
            const isLegalMove = (r, c) => {
                if (!selected.value) return false;
                const sq = String.fromCharCode(97 + c) + (8 - r);
                return game.moves({ square: selected.value, verbose: true }).some(m => m.to === sq && !m.captured);
            };
            const isCaptureMove = (r, c) => {
                if (!selected.value) return false;
                const sq = String.fromCharCode(97 + c) + (8 - r);
                return game.moves({ square: selected.value, verbose: true }).some(m => m.to === sq && m.captured);
            };

            onMounted(() => syncState());

            return {
                gameStarted, lobbyId, meshStatus, connectionMode, gameOverMessage,
          boardState, turn, flipped, moveHistory, captured,
          initLocalGame, hostMeshGame, joinMeshGame, resetGame, formatLobbyId,
          handleSquareClick, isSelected, isLastMove, isLegalMove, isCaptureMove,
          evalScore: computed(() => 50), // Static for now, can add engine later
          getPieceURL: (p) => `https://lichess1.org/assets/piece/cburnett/${p.color}${p.type.toUpperCase()}.svg`
            };
    }
}).mount('#app');
