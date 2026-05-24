const { createApp, ref, onMounted, onUnmounted, reactive, nextTick } = Vue;

createApp({
    setup() {
        const snakeCanvas = ref(null);
        const arenaWrapper = ref(null);

        const score = ref(0);
        const highScore = ref(0);
        const gameState = reactive({ running: false, gameOver: false });

        // Expanded 30x30 High-Resolution Grid Config Matrix
        const GRID_SIZE = 20; 
        const CELL_COUNT = 30; 

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

            ctx.clearRect(0, 0, snakeCanvas.value.width, snakeCanvas.value.height);

            // Render Target Node Vector (Food)
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(food.x * GRID_SIZE + 1, food.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);

            // Render Array Segments (Snake Body)
            snake.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? "#34d399" : "#10b981";
                ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            });
        };

        const handleInput = (keyString) => {
            if (!gameState.running) return;

            switch (keyString) {
                case 'ArrowUp':
                case 'KeyW':
                    if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
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

            // Balance-adjusted start vectors for larger matrix
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
                
                // Establish internal 600x600 coordinate drawing space
                snakeCanvas.value.width = GRID_SIZE * CELL_COUNT;
                snakeCanvas.value.height = GRID_SIZE * CELL_COUNT;
                
                renderGrid();
                
                // Paced down tick timing sequence to 160ms for smooth, relaxed navigation
                gameIntervalId = setInterval(updateGameTick, 160);
            });
        };

        onMounted(() => {
            ctx = snakeCanvas.value.getContext('2d');
            window.addEventListener('keydown', (e) => handleInput(e.code));
            
            snakeCanvas.value.width = GRID_SIZE * CELL_COUNT;
            snakeCanvas.value.height = GRID_SIZE * CELL_COUNT;
        });

        onUnmounted(() => {
            if (gameIntervalId) clearInterval(gameIntervalId);
        });

        return {
            snakeCanvas, arenaWrapper,
            score, highScore, gameState,
            startSimulation, sendInput
        };
    }
}).mount('#app');
