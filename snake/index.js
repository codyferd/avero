const { createApp, ref, onMounted, onUnmounted, reactive, nextTick } = Vue;

createApp({
    setup() {
        const snakeCanvas = ref(null);
        const arenaWrapper = ref(null);

        const score = ref(0);
        const highScore = ref(0);
        const gameState = reactive({ running: false, gameOver: false });

        // Expanded 30x30 High-Resolution Grid Config Matrix
        const CELL_COUNT = 30; 
        const BASE_RESOLUTION = 600; // Internal drawing coordinate frame matrix bound

        let ctx = null;
        let gameIntervalId = null;

        let snake = [];
        let food = { x: 0, y: 0 };
        let velocity = { x: 0, y: 0 };
        let nextVelocity = { x: 0, y: 0 };

        const spawnFood = () => {
            while (true) {
                let rx = Math.floor(Math.random() * CELL_COUNT);
                let ry = Math.floor(Math.random() * CELL_COUNT);
                
                let occupied = snake.some(segment => segment.x === rx && segment.y === ry);
                if (!occupied) {
                    food.x = rx;
                    food.y = ry;
                    break;
                }
            }
        };

        const updateGameTick = () => {
            if (!gameState.running) return;

            velocity = { ...nextVelocity };
            const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

            // Wall Impact Detection
            if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
                terminateSimulation();
                return;
            }

            // Self Intersect Detection
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === head.x && snake[i].y === head.y) {
                    terminateSimulation();
                    return;
                }
            }

            snake.unshift(head);

            // Food Check
            if (head.x === food.x && head.y === food.y) {
                score.value += 10;
                if (score.value > highScore.value) {
                    highScore.value = score.value;
                }
                spawnFood();
            } else {
                snake.pop();
            }

            renderGrid();
        };

        const renderGrid = () => {
            if (!ctx || !snakeCanvas.value) return;

            // Compute dynamic cell size based on the single constant backing resolution
            const currentBlockSize = BASE_RESOLUTION / CELL_COUNT;

            ctx.clearRect(0, 0, BASE_RESOLUTION, BASE_RESOLUTION);

            // Render Target Node Vector (Food)
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(
                food.x * currentBlockSize + 1, 
                food.y * currentBlockSize + 1, 
                currentBlockSize - 2, 
                currentBlockSize - 2
            );

            // Render Array Segments (Snake Body)
            snake.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? "#34d399" : "#10b981";
                ctx.fillRect(
                    segment.x * currentBlockSize + 1, 
                    segment.y * currentBlockSize + 1, 
                    currentBlockSize - 2, 
                    currentBlockSize - 2
                );
            });
        };

        // Dual Axis Layout Scaling Engine
        const handleResize = () => {
            if (!arenaWrapper.value || !snakeCanvas.value) return;

            // Grab the client component workspace dimensions in realtime
            const availableWidth = arenaWrapper.value.clientWidth;
            const availableHeight = arenaWrapper.value.clientHeight;

            // Calculate the maximum possible dimension to fit a clean 1:1 aspect ratio square box
            let minEdgeBound = Math.min(availableWidth, availableHeight);

            // Restrict bounds down safely to keep elements within clear limits
            if (minEdgeBound < 180) minEdgeBound = 180;

            // Retain absolute internal grid scale buffer to avoid blurry object rendering
            snakeCanvas.value.width = BASE_RESOLUTION;
            snakeCanvas.value.height = BASE_RESOLUTION;

            // Update layout constraints seamlessly via CSS string styles
            snakeCanvas.value.style.width = `${minEdgeBound - 8}px`;
            snakeCanvas.value.style.height = `${minEdgeBound - 8}px`;

            // Adjust outer decorative border frames instantly without visual shifting
            snakeCanvas.value.parentElement.style.width = `${minEdgeBound}px`;
            snakeCanvas.value.parentElement.style.height = `${minEdgeBound}px`;

            renderGrid();
        };

        const handleInput = (keyString) => {
            // Unify system code identifiers to process virtual inputs cleanly alongside hardware boards
            let command = keyString;
            if (command === 'KeyW') command = 'ArrowUp';
            if (command === 'KeyS') command = 'ArrowDown';
            if (command === 'KeyA') command = 'ArrowLeft';
            if (command === 'KeyD') command = 'ArrowRight';

            switch (command) {
                case 'ArrowUp':
                    if (velocity.y !== 1 && snake[1].y !== snake[0].y - 1) nextVelocity = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                    if (velocity.y !== -1 && snake[1].y !== snake[0].y + 1) nextVelocity = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                    if (velocity.x !== 1 && snake[1].x !== snake[0].x - 1) nextVelocity = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                    if (velocity.x !== -1 && snake[1].x !== snake[0].x + 1) nextVelocity = { x: 1, y: 0 };
                    break;
            }
        };

        const sendInput = (stringCode) => {
            handleInput(stringCode);
        };

        const terminateSimulation = () => {
            gameState.running = false;
            gameState.gameOver = true;
            if (gameIntervalId) clearInterval(gameIntervalId);
        };

        const startSimulation = () => {
            score.value = 0;
            gameState.running = true;
            gameState.gameOver = false;

            snake = [
                { x: 15, y: 15 },
                { x: 14, y: 15 },
                { x: 13, y: 15 }
            ];

            velocity = { x: 1, y: 0 };
            nextVelocity = { x: 1, y: 0 };

            spawnFood();

            nextTick(() => {
                if (gameIntervalId) clearInterval(gameIntervalId);
                handleResize();
                gameIntervalId = setInterval(updateGameTick, 140); // Optimized tempo rate
            });
        };

        onMounted(() => {
            ctx = snakeCanvas.value.getContext('2d');
            window.addEventListener('keydown', (e) => handleInput(e.code));
            window.addEventListener('resize', handleResize);
            
            setTimeout(() => {
                handleResize();
            }, 60);
        });

        onUnmounted(() => {
            if (gameIntervalId) clearInterval(gameIntervalId);
            window.removeEventListener('resize', handleResize);
        });

        return {
            snakeCanvas, arenaWrapper,
            score, highScore, gameState,
            startSimulation, sendInput
        };
    }
}).mount('#app');
