const { createApp, ref, onMounted, onUnmounted, reactive, nextTick } = Vue;

createApp({
    setup() {
        const gameCanvas = ref(null);
        const nextCanvasUniversal = ref(null);
        const canvasWrapper = ref(null);

        const score = ref(0);
        const level = ref(1);
        const lines = ref(0);
        const gameState = reactive({ running: false, gameOver: false });

        const COLS = 10, ROWS = 20;
        let blockSize = 20; // Calculated runtime tracking parameter 

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

        let ctx, nextCtxUniversal, grid, piece, nextPiece, requestId, lastTime = 0, dropCounter = 0;

        const createGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

        const createPiece = (type) => {
            const shape = SHAPES[type];
            return { pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }, shape, type };
        };

        const drawBlock = (x, y, color, targetCtx = ctx, alpha = 1) => {
            targetCtx.globalAlpha = alpha;
            targetCtx.fillStyle = color;
            targetCtx.fillRect(Math.floor(x * blockSize), Math.floor(y * blockSize), Math.ceil(blockSize - 1), Math.ceil(blockSize - 1));
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
            if (!nextCtxUniversal) return;
            
            nextCtxUniversal.clearRect(0, 0, 60, 30);
            
            // Auto calculate offsets to center dynamic blocks inside tiny frame window cleanly
            const pWidth = nextPiece.shape[0].length * 10;
            const pHeight = nextPiece.shape.length * 10;
            const offsetX = (60 - pWidth) / 2;
            const offsetY = (30 - pHeight) / 2;

            nextPiece.shape.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) {
                        nextCtxUniversal.fillStyle = COLORS[nextPiece.type];
                        nextCtxUniversal.fillRect(x * 10 + offsetX, y * 10 + offsetY, 9, 9);
                    }
                });
            });
        };

        const draw = () => {
            if (!ctx || !grid || !gameCanvas.value) return;

            ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

            grid.forEach((row, y) => row.forEach((type, x) => {
                if (type) drawBlock(x, y, COLORS[type]);
            }));

            if (piece) {
                let ghost = { ...piece, pos: { ...piece.pos } };
                while (!collide(grid, ghost)) ghost.pos.y++;
                ghost.pos.y--;

                piece.shape.forEach((row, y) => row.forEach((v, x) => {
                    if (v) drawBlock(x + ghost.pos.x, y + ghost.pos.y, '#ffffff', ctx, 0.06);
                }));

                piece.shape.forEach((row, y) => row.forEach((v, x) => {
                    if (v) drawBlock(x + piece.pos.x, y + piece.pos.y, COLORS[piece.type]);
                }));
            }
        };

        const update = (time = 0) => {
            if (!gameState.running) return;
            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;
            if (dropCounter > Math.max(50, 1000 - (level.value * 50))) {
                moveDown();
            }
            draw();
            requestId = requestAnimationFrame(update);
        };

        const moveDown = () => {
            if (!piece) return;
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
            if (!piece) return;
            while (!collide(grid, piece)) piece.pos.y++;
            piece.pos.y--;
            merge(grid, piece);
            clearLines();
            resetPiece();
            draw();
        };

        // Dual Axis Precision Scale Calculation Engine
        const resizeGameCanvas = () => {
            if (!canvasWrapper.value || !gameCanvas.value) return;

            // Extract real time parent available container footprint bounds
            const parentWidth = canvasWrapper.value.clientWidth;
            const parentHeight = canvasWrapper.value.clientHeight;

            // Calculate scaling limiters for both axes independently
            const sizeByWidth = parentWidth / COLS;
            const sizeByHeight = parentHeight / ROWS;

            // Pinned Core Limit: Choose whichever axis runs out of room first
            blockSize = Math.min(sizeByWidth, sizeByHeight);

            // Cap block sizes to logical UI boundaries
            if (blockSize < 10) blockSize = 10;
            if (blockSize > 35) blockSize = 35;

            // Map precise backing resolution dimension properties to match block scale factors
            gameCanvas.value.width = blockSize * COLS;
            gameCanvas.value.height = blockSize * ROWS;

            // Dynamically resize wrapping element layout nodes to eliminate visual border stretching
            gameCanvas.value.parentElement.style.width = `${gameCanvas.value.width + 8}px`;
            gameCanvas.value.parentElement.style.height = `${gameCanvas.value.height + 8}px`;

            draw();
            drawNext();
        };

        const handleKeys = (e) => {
            const code = e.code || e; 
            
            if (code === 'KeyP') {
                gameState.running = !gameState.running;
                if (gameState.running) {
                    lastTime = performance.now();
                    update();
                }
                return;
            }

            if (!gameState.running || !piece) return;

            switch (code) {
                case 'KeyA':
                    piece.pos.x--; 
                    if (collide(grid, piece)) piece.pos.x++;
                    break;
                case 'KeyD':
                    piece.pos.x++; 
                    if (collide(grid, piece)) piece.pos.x--;
                    break;
                case 'KeyS':
                    moveDown();
                    break;
                case 'KeyW':
                case 'KeyI':
                    rotate(piece);
                    break;
                case 'Space':
                case 'KeyK':
                    hardDrop();
                    break;
            }
            draw();
        };

        const sendInput = (stringCode) => {
            handleKeys(stringCode);
        };

        const startGame = () => {
            grid = createGrid();
            score.value = 0; level.value = 1; lines.value = 0;
            gameState.running = true; gameState.gameOver = false;
            resetPiece();
            nextTick(() => {
                resizeGameCanvas();
                lastTime = performance.now();
                update();
            });
        };

        onMounted(() => {
            ctx = gameCanvas.value.getContext('2d');
            if (nextCanvasUniversal.value) nextCtxUniversal = nextCanvasUniversal.value.getContext('2d');

            window.addEventListener('keydown', handleKeys);
            window.addEventListener('resize', resizeGameCanvas);

            // Yield frame thread execution to allow DOM elements to fully settle before initialization sizing calculations
            setTimeout(() => {
                resizeGameCanvas();
            }, 50);
        });

        onUnmounted(() => {
            cancelAnimationFrame(requestId);
            window.removeEventListener('keydown', handleKeys);
            window.removeEventListener('resize', resizeGameCanvas);
        });

        return {
            gameCanvas, nextCanvasUniversal, canvasWrapper,
            score, level, lines, gameState,
            startGame, sendInput
        };
    }
}).mount('#app');
