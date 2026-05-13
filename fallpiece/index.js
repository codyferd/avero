const { createApp, ref, onMounted, onUnmounted, reactive } = Vue;

createApp({
    setup() {
        const gameCanvas = ref(null);
        const nextCanvas = ref(null);
        const score = ref(0);
        const level = ref(1);
        const lines = ref(0);
        const gameState = reactive({ running: false, gameOver: false });

        // Tetromino Definitions
        const COLS = 10, ROWS = 20, BLOCK_SIZE = 30;
        const SHAPES = {
            'I': [[1, 1, 1, 1]],
          'J': [[1, 0, 0], [1, 1, 1]],
          'L': [[0, 0, 1], [1, 1, 1]],
          'O': [[1, 1], [1, 1]],
          'S': [[0, 1, 1], [1, 1, 0]],
          'T': [[0, 1, 0], [1, 1, 1]],
          'Z': [[1, 1, 0], [0, 1, 1]]
        };
        const COLORS = { 'I': '#2dd4bf', 'J': '#6366f1', 'L': '#f59e0b', 'O': '#fbbf24', 'S': '#4ade80', 'T': '#a855f7', 'Z': '#f43f5e' };

        let ctx, nextCtx, grid, piece, nextPiece, requestId, lastTime = 0, dropCounter = 0;

        const createGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

        const createPiece = (type) => {
            const shape = SHAPES[type];
            return { pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }, shape, type };
        };

        const drawBlock = (x, y, color, targetCtx = ctx, alpha = 1) => {
            targetCtx.globalAlpha = alpha;
            targetCtx.fillStyle = color;
            targetCtx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            targetCtx.globalAlpha = 1;
        };

        const collide = (g, p) => {
            for (let y = 0; y < p.shape.length; y++) {
                for (let x = 0; x < p.shape[y].length; x++) {
                    if (p.shape[y][x] !== 0 && (g[y + p.pos.y]?.[x + p.pos.x] !== 0)) return true;
                }
            }
            return false;
        };

        const merge = (g, p) => {
            p.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) g[y + p.pos.y][x + p.pos.x] = p.type;
                });
            });
        };

        const rotate = (p) => {
            const matrix = p.shape[0].map((_, i) => p.shape.map(row => row[i]).reverse());
            const oldShape = p.shape;
            p.shape = matrix;
            if (collide(grid, p)) p.shape = oldShape;
        };

            const clearLines = () => {
                let rowCount = 0;
                for (let y = ROWS - 1; y >= 0; y--) {
                    if (grid[y].every(value => value !== 0)) {
                        grid.splice(y, 1);
                        grid.unshift(Array(COLS).fill(0));
                        rowCount++;
                        y++;
                    }
                }
                if (rowCount > 0) {
                    lines.value += rowCount;
                    score.value += [0, 100, 300, 500, 800][rowCount] * level.value;
                    level.value = Math.floor(lines.value / 10) + 1;
                }
            };

            const resetPiece = () => {
                const types = 'IJLOSTZ';
                piece = nextPiece || createPiece(types[Math.random() * types.length | 0]);
                nextPiece = createPiece(types[Math.random() * types.length | 0]);
                drawNext();
                if (collide(grid, piece)) {
                    gameState.running = false;
                    gameState.gameOver = true;
                }
            };

            const drawNext = () => {
                nextCtx.clearRect(0, 0, 80, 80);
                nextPiece.shape.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val) {
                            nextCtx.fillStyle = COLORS[nextPiece.type];
                            nextCtx.fillRect(x * 20 + 10, y * 20 + 10, 19, 19);
                        }
                    });
                });
            };

            const draw = () => {
                ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
                grid.forEach((row, y) => row.forEach((type, x) => {
                    if (type) drawBlock(x, y, COLORS[type]);
                }));

                    // Draw Ghost
                    let ghost = { ...piece, pos: { ...piece.pos } };
                    while (!collide(grid, ghost)) ghost.pos.y++;
                    ghost.pos.y--;
                piece.shape.forEach((row, y) => row.forEach((v, x) => {
                    if (v) drawBlock(x + ghost.pos.y, y + ghost.pos.y, '#ffffff', ctx, 0.1); // Simple ghost
                }));

                    piece.shape.forEach((row, y) => row.forEach((v, x) => {
                        if (v) drawBlock(x + piece.pos.x, y + piece.pos.y, COLORS[piece.type]);
                    }));
            };

            const update = (time = 0) => {
                if (!gameState.running) return;
                const deltaTime = time - lastTime;
                lastTime = time;
                dropCounter += deltaTime;
                if (dropCounter > (1000 - (level.value * 50))) {
                    moveDown();
                }
                draw();
                requestId = requestAnimationFrame(update);
            };

            const moveDown = () => {
                piece.pos.y++;
                if (collide(grid, piece)) {
                    piece.pos.y--;
                    merge(grid, piece);
                    clearLines();
                    resetPiece();
                }
                dropCounter = 0;
            };

            const hardDrop = () => {
                while (!collide(grid, piece)) piece.pos.y++;
                piece.pos.y--;
                merge(grid, piece);
                clearLines();
                resetPiece();
                draw();
            };

            const startGame = () => {
                grid = createGrid();
                score.value = 0; level.value = 1; lines.value = 0;
                gameState.running = true; gameState.gameOver = false;
                resetPiece();
                update();
            };

            const handleKeys = (e) => {
                if (!gameState.running) return;
                if (e.keyCode === 37) { piece.pos.x--; if (collide(grid, piece)) piece.pos.x++; }
                if (e.keyCode === 39) { piece.pos.x++; if (collide(grid, piece)) piece.pos.x--; }
                if (e.keyCode === 40) moveDown();
                if (e.keyCode === 38) rotate(piece);
                if (e.keyCode === 32) hardDrop();
                if (e.key === 'p') gameState.running = !gameState.running;
            };

                onMounted(() => {
                    ctx = gameCanvas.value.getContext('2d');
                    nextCtx = nextCanvas.value.getContext('2d');
                    window.addEventListener('keydown', handleKeys);
                });

                onUnmounted(() => {
                    cancelAnimationFrame(requestId);
                    window.removeEventListener('keydown', handleKeys);
                });

                return { gameCanvas, nextCanvas, score, level, lines, gameState, startGame };
    }
}).mount('#app');
