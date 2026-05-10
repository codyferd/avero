const { createApp, ref, reactive, onMounted, computed, watch } = Vue;

createApp({
    setup() {
        const game = new Chess();

        // --- STATE ---
        const gameStarted = ref(false);
        const lobbyId = ref('');
        const meshStatus = ref('');
        const errorToast = ref('');
        const connectionMode = ref('Local');
        const gameOverMessage = ref('');
        const currentOpening = ref('Starting Position');

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

        const syncState = () => {
            boardState.value = game.board();
            turn.value = game.turn();
            moveHistory.value = game.history({ verbose: true });

            // Captured pieces calculation
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

        // --- AI LOGIC (Stockfish API Replacement) ---
        const fetchAiMove = async () => {
            if (isAiThinking.value || game.game_over()) return;
            isAiThinking.value = true;

            try {
                // Using the Stockfish Online API (Stable alternative to Lichess Cloud)
                const fen = encodeURIComponent(game.fen());
                const response = await fetch(`https://stockfish.online/api/s/v2.php?fen=${fen}&depth=12`);
                const data = await response.json();

                if (data.success && data.bestmove) {
                    // bestmove format: "bestmove e2e4 ponder..."
                    const parts = data.bestmove.split(' ');
                    const moveStr = parts[1];
                    const from = moveStr.substring(0, 2);
                    const to = moveStr.substring(2, 4);
                    const promo = moveStr.substring(4, 5) || 'q';

                    const move = game.move({ from, to, promotion: promo });
                    if (move) {
                        lastMove.value = { from, to };
                        syncState();
                    }
                }
            } catch (e) {
                console.error("AI API Error:", e);
                showToast("AI Engine Timeout");
            } finally {
                isAiThinking.value = false;
            }
        };

        const showToast = (msg) => {
            errorToast.value = msg;
            setTimeout(() => errorToast.value = '', 3000);
        };

        watch(turn, (newTurn) => {
            if (isAiMode.value && newTurn === 'b' && !game.game_over()) {
                setTimeout(fetchAiMove, 600);
            }
        });

        // --- MESH ACTIONS ---
        const formatLobbyId = () => {
            lobbyId.value = lobbyId.value.replace(/\s+/g, '-').toLowerCase();
        };

        const hostMeshGame = () => {
            if (!lobbyId.value) return showToast("Name required");
            connectionMode.value = 'Host';
            Mesh.initHost(lobbyId.value, {
                onStatus: (s) => meshStatus.value = s,
                          onStarted: () => gameStarted.value = true,
                          onRemoteMove: (m) => { game.move(m); lastMove.value = m; syncState(); },
                          onKick: (msg) => { showToast(msg); resetGame(); }
            });
        };

        const joinMeshGame = () => {
            if (!lobbyId.value) return showToast("Name required");
            connectionMode.value = 'Peer';
            Mesh.initJoin(lobbyId.value, {
                onStatus: (s) => meshStatus.value = s,
                          onStarted: () => { gameStarted.value = true; flipped.value = true; },
                          onRemoteMove: (m) => { game.move(m); lastMove.value = m; syncState(); },
                          onKick: (msg) => { showToast(msg); resetGame(); }
            });
        };

        const initAiGame = () => { isAiMode.value = true; connectionMode.value = 'VS AI'; gameStarted.value = true; syncState(); };
        const initLocalGame = () => { connectionMode.value = 'Local'; gameStarted.value = true; syncState(); };

        const resetGame = () => {
            game.reset();
            gameStarted.value = false;
            isAiMode.value = false;
            gameOverMessage.value = '';
            flipped.value = false;
            if (Mesh.peer) Mesh.peer.destroy();
        };

            const handleSquareClick = (r, c) => {
                if (game.game_over() || (isAiMode.value && game.turn() === 'b')) return;

                const square = String.fromCharCode(97 + c) + (8 - r);
                const piece = game.get(square);

                if (Mesh.state.isMesh) {
                    if (game.turn() !== Mesh.state.myColor) return;
                }

                if (selected.value) {
                    const move = game.move({ from: selected.value, to: square, promotion: 'q' });
                    if (move) {
                        if (Mesh.state.isMesh) Mesh.sendMove({ from: move.from, to: move.to });
                        lastMove.value = { from: move.from, to: move.to };
                        syncState();
                    }
                    selected.value = null;
                } else if (piece && piece.color === game.turn()) {
                    selected.value = square;
                }
            };

            onMounted(() => syncState());

            return {
                gameStarted, lobbyId, meshStatus, connectionMode, gameOverMessage, errorToast,
          boardState, turn, flipped, moveHistory, captured,
          initLocalGame, hostMeshGame, joinMeshGame, initAiGame, resetGame, formatLobbyId,
          handleSquareClick, isSelected: (r, c) => selected.value === (String.fromCharCode(97 + c) + (8 - r)),
          isLastMove: (r, c) => {
              const sq = String.fromCharCode(97 + c) + (8 - r);
              return lastMove.value.from === sq || lastMove.value.to === sq;
          },
          isLegalMove: (r, c) => {
              if (!selected.value) return false;
              const sq = String.fromCharCode(97 + c) + (8 - r);
              return game.moves({ square: selected.value, verbose: true }).some(m => m.to === sq && !m.captured);
          },
          isCaptureMove: (r, c) => {
              if (!selected.value) return false;
              const sq = String.fromCharCode(97 + c) + (8 - r);
              return game.moves({ square: selected.value, verbose: true }).some(m => m.to === sq && m.captured);
          },
          evalScore: computed(() => 50),
          getPieceURL: (p) => `https://lichess1.org/assets/piece/cburnett/${p.color}${p.type.toUpperCase()}.svg`
            };
    }
}).mount('#app');
