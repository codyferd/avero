const { createApp, ref, reactive, watch } = Vue;

createApp({
    setup() {
        const gameStarted = ref(false);
        const game = ref(null);
        const boardState = ref([]);
        const turn = ref('w');
        const selected = ref(null);
        const legalMoves = ref([]);
        const flipped = ref(false);
        const captured = reactive({ w: [], b: [] });
        const scores = reactive({ w: 0, b: 0 });
        const moveHistory = ref([]);
        const lastMoveSquares = ref([]);
        const gameOverMessage = ref(null);

        // Material-based evaluation bar (0-100)
        const evalScore = ref(50);

        const initGame = () => {
            game.value = new Chess();
            gameStarted.value = true;
            gameOverMessage.value = null;
            selected.value = null;
            moveHistory.value = [];
            lastMoveSquares.value = [];
            captured.w = [];
            captured.b = [];
            flipped.value = false;
            evalScore.value = 50;
            syncState();
        };

        const syncState = () => {
            boardState.value = game.value.board();
            turn.value = game.value.turn();
            calculateScores();
            checkEnd();
        };

        const calculateScores = () => {
            const vals = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            let w = 0, b = 0;
            boardState.value.flat().filter(s => s).forEach(s => {
                if (s.color === 'w') w += vals[s.type];
                else b += vals[s.type];
            });
                scores.w = w;
                scores.b = b;

                // Material-based eval bar calculation
                const diff = w - b;
                evalScore.value = Math.max(10, Math.min(90, 50 + (diff * 2)));
        };

        const checkEnd = () => {
            if (game.value.game_over()) {
                if (game.value.in_checkmate()) {
                    gameOverMessage.value = `MATCH TERMINATED: ${turn.value === 'w' ? 'Black' : 'White'} Victory.`;
                } else if (game.value.in_draw()) {
                    gameOverMessage.value = "Stalemate / Draw Detected.";
                } else {
                    gameOverMessage.value = "Game Over.";
                }
            }
        };

        const handleSquareClick = (r, c) => {
            if (gameOverMessage.value) return;

            const pos = String.fromCharCode(97 + c) + (8 - r);
            const piece = boardState.value[r][c];

            if (selected.value) {
                try {
                    const move = game.value.move({ from: selected.value, to: pos, promotion: 'q' });
                    if (move) {
                        if (move.captured) captured[move.color].push(move.captured);
                        moveHistory.value.push(move);
                        lastMoveSquares.value = [move.from, move.to];
                        selected.value = null;
                        legalMoves.value = [];
                        syncState();
                    } else if (piece && piece.color === turn.value) {
                        updateSelection(pos);
                    } else {
                        selected.value = null;
                        legalMoves.value = [];
                    }
                } catch (e) { selected.value = null; }
            } else if (piece && piece.color === turn.value) {
                updateSelection(pos);
            }
        };

        const updateSelection = (pos) => {
            selected.value = pos;
            legalMoves.value = game.value.moves({ square: pos, verbose: true });
        };

        const getPieceURL = (p) => {
            const map = {
                wp: "4/45/Chess_plt45.svg", wr: "7/72/Chess_rlt45.svg", wn: "7/70/Chess_nlt45.svg",
          wb: "b/b1/Chess_blt45.svg", wq: "1/15/Chess_qlt45.svg", wk: "4/42/Chess_klt45.svg",
          bp: "c/c7/Chess_pdt45.svg", br: "f/ff/Chess_rdt45.svg", bn: "e/ef/Chess_ndt45.svg",
          bb: "9/98/Chess_bdt45.svg", bq: "4/47/Chess_qdt45.svg", bk: "f/f0/Chess_kdt45.svg",
            };
            return `https://upload.wikimedia.org/wikipedia/commons/${map[p.color + p.type]}`;
        };

        const isSelected = (r, c) => selected.value === (String.fromCharCode(97 + c) + (8 - r));
        const isLastMove = (r, c) => lastMoveSquares.value.includes(String.fromCharCode(97 + c) + (8 - r));
        const isLegalMove = (r, c) => legalMoves.value.some(m => m.to === (String.fromCharCode(97 + c) + (8 - r)) && !m.captured);
        const isCaptureMove = (r, c) => legalMoves.value.some(m => m.to === (String.fromCharCode(97 + c) + (8 - r)) && m.captured);

        return {
            gameStarted, boardState, turn, flipped, captured, scores,
          moveHistory, gameOverMessage, initGame, getPieceURL, handleSquareClick,
          isSelected, isLastMove, isLegalMove, isCaptureMove, evalScore
        };
    },
}).mount("#app");
