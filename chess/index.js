const { createApp, ref, reactive, onMounted, computed, watch } = Vue;

createApp({
    setup() {
        const game = new Chess();

        // --- STATE ---
        const gameStarted = ref(false);
        const lobbyId = ref('');
        const meshStatus = ref('');
        const connectionMode = ref('Local');
        const gameOverMessage = ref('');

        // AI State
        const isAiMode = ref(false);
        const isAiThinking = ref(false);

        // Board State
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

            // Checkmate & End Detection
            if (game.game_over()) {
                if (game.in_checkmate()) {
                    gameOverMessage.value = `Checkmate! ${turn.value === 'w' ? 'Black' : 'White'} wins.`;
                } else if (game.in_draw()) {
                    gameOverMessage.value = "Draw!";
                } else {
                    gameOverMessage.value = "Game Over";
                }
            }
        };

        const formatLobbyId = () => {
            lobbyId.value = lobbyId.value
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase();
        };

        // --- AI LOGIC ---
        const initAiGame = () => {
            isAiMode.value = true;
            connectionMode.value = 'AI Mode';
            gameStarted.value = true;
            syncState();
        };

        const fetchAiMove = async () => {
            if (isAiThinking.value || game.game_over()) return;
            isAiThinking.value = true;

            try {
                const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(game.fen())}`);
                const data = await response.json();

                if (data.pvs && data.pvs.length > 0) {
                    const uci = data.pvs[0].moves.split(' ')[0];
                    const from = uci.substring(0, 2);
                    const to = uci.substring(2, 4);

                    // Validate the move before applying
                    const move = game.move({ from, to, promotion: 'q' });
                    if (move) {
                        lastMove.value = { from, to };
                        syncState();
                    } else {
                        console.warn("AI attempted illegal move:", from, to);
                    }
                }
            } catch (e) {
                console.error("AI Connection Failed:", e);
            } finally {
                isAiThinking.value = false;
            }
        };


        // Watch for turn changes to trigger AI
        watch(turn, (newTurn) => {
            if (isAiMode.value && newTurn === 'b' && !game.game_over()) {
                setTimeout(fetchAiMove, 500); // Artificial delay for realism
            }
        });

        // --- MESH ACTIONS ---
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
                              flipped.value = true;
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
            isAiMode.value = false;
            gameOverMessage.value = '';
            meshStatus.value = '';
            flipped.value = false;
            lastMove.value = { from: null, to: null };
            if (Mesh.peer) Mesh.peer.destroy();
        };

            // --- INTERACTION ---
            const handleSquareClick = (r, c) => {
                // Guard: Game Over
                if (game.game_over()) return;

                // Guard: AI Thinking
                if (isAiMode.value && game.turn() === 'b') return;

                const square = String.fromCharCode(97 + c) + (8 - r);
                const piece = game.get(square);

                // Guard: Mesh Protection
                if (Mesh.state.isMesh) {
                    if (game.turn() !== Mesh.state.myColor) return;
                    if (!selected.value && piece && piece.color !== Mesh.state.myColor) return;
                }

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
                initLocalGame, hostMeshGame, joinMeshGame, initAiGame, resetGame, formatLobbyId,
                handleSquareClick, isSelected, isLastMove, isLegalMove, isCaptureMove,
                evalScore: computed(() => 50),
          getPieceURL: (p) => `https://lichess1.org/assets/piece/cburnett/${p.color}${p.type.toUpperCase()}.svg`
            };
    }
}).mount('#app');

