const { createApp, ref, onMounted, onUnmounted, reactive, nextTick } = Vue;

createApp({
    setup() {
        const pongCanvas = ref(null);
        const arenaWrapper = ref(null);

        const scores = reactive({ p1: 0, p2: 0 });
        const gameState = reactive({ running: false, gameOver: false });
        const winner = ref(null);

        // Core Backing Coordinate Frame Constants
        const BASE_WIDTH = 800;
        const BASE_HEIGHT = 600;
        const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT; // 4:3 Aspect

        let ctx = null;
        let requestId = null;

        const paddleWidth = 12;
        const paddleHeight = 100;
        const ballRadius = 8;

        const p1 = reactive({ x: 20, y: 250, score: 0 });
        const p2 = reactive({ x: 768, y: 250, score: 0 });
        const ball = reactive({ x: 400, y: 300, vx: 0, vy: 0, speed: 7 });

        const keysPressed = {};

        const initBall = (direction) => {
            ball.x = BASE_WIDTH / 2;
            ball.y = BASE_HEIGHT / 2;
            ball.speed = 7;
            
            let angle = (Math.random() * 60 - 30) * (Math.PI / 180); 
            ball.vx = direction * ball.speed * Math.cos(angle);
            ball.vy = ball.speed * Math.sin(angle);
        };

        const updatePhysics = () => {
            // Paddle Movement Metrics (Handles mapped touch state and keys simultaneously)
            if (keysPressed['KeyW'] || keysPressed['w']) p1.y = Math.max(10, p1.y - 8);
            if (keysPressed['KeyS'] || keysPressed['s']) p1.y = Math.min(BASE_HEIGHT - paddleHeight - 10, p1.y + 8);
            
            if (keysPressed['ArrowUp']) p2.y = Math.max(10, p2.y - 8);
            if (keysPressed['ArrowDown']) p2.y = Math.min(BASE_HEIGHT - paddleHeight - 10, p2.y + 8);

            // Ball Translation Vectors
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Boundary Wall Collision (Ceiling/Floor reflection)
            if (ball.y - ballRadius <= 0) {
                ball.y = ballRadius;
                ball.vy = -ball.vy;
            } else if (ball.y + ballRadius >= BASE_HEIGHT) {
                ball.y = BASE_HEIGHT - ballRadius;
                ball.vy = -ball.vy;
            }

            // Paddle Interception Calculators
            // Left Paddle (P1)
            if (ball.vx < 0 && ball.x - ballRadius <= p1.x + paddleWidth && ball.x + ballRadius >= p1.x) {
                if (ball.y >= p1.y && ball.y <= p1.y + paddleHeight) {
                    ball.x = p1.x + paddleWidth + ballRadius;
                    bounceBall(p1.y);
                }
            }
            // Right Paddle (P2)
            if (ball.vx > 0 && ball.x + ballRadius >= p2.x && ball.x - ballRadius <= p2.x + paddleWidth) {
                if (ball.y >= p2.y && ball.y <= p2.y + paddleHeight) {
                    ball.x = p2.x - ballRadius;
                    bounceBall(p2.y);
                }
            }

            // Score Registers
            if (ball.x < 0) {
                scores.p2++;
                checkMatchLimit(1);
            } else if (ball.x > BASE_WIDTH) {
                scores.p1++;
                checkMatchLimit(-1);
            }
        };

        const bounceBall = (paddleY) => {
            ball.speed = Math.min(16, ball.speed + 0.6);
            
            let relativeIntersectY = (paddleY + (paddleHeight / 2)) - ball.y;
            let normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
            let bounceAngle = normalizedIntersectY * (Math.PI / 3); 

            let direction = ball.vx > 0 ? -1 : 1;
            ball.vx = direction * ball.speed * Math.cos(bounceAngle);
            ball.vy = ball.speed * -Math.sin(bounceAngle);
        };

        const checkMatchLimit = (nextServeDirection) => {
            if (scores.p1 >= 7) {
                winner.value = 1;
                gameState.running = false;
                gameState.gameOver = true;
            } else if (scores.p2 >= 7) {
                winner.value = 2;
                gameState.running = false;
                gameState.gameOver = true;
            } else {
                initBall(nextServeDirection);
            }
        };

        const renderFrame = () => {
            if (!ctx || !pongCanvas.value) return;

            ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

            // Center Net Court Guidelines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(BASE_WIDTH / 2, 0);
            ctx.lineTo(BASE_WIDTH / 2, BASE_HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]); 

            // Left Unit
            ctx.fillStyle = "#818cf8";
            ctx.fillRect(p1.x, p1.y, paddleWidth, paddleHeight);

            // Right Unit
            ctx.fillStyle = "#34d399";
            ctx.fillRect(p2.x, p2.y, paddleWidth, paddleHeight);

            // Floating Ball
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
        };

        const gameLoop = () => {
            if (!gameState.running) return;
            updatePhysics();
            renderFrame();
            requestId = requestAnimationFrame(gameLoop);
        };

        // Complete Horizontal and Vertical Auto Scaling Vector Module
        const handleResize = () => {
            if (!arenaWrapper.value || !pongCanvas.value) return;

            const availableWidth = arenaWrapper.value.clientWidth;
            const availableHeight = arenaWrapper.value.clientHeight;

            let finalWidth = availableWidth;
            let finalHeight = availableWidth / ASPECT_RATIO;

            if (finalHeight > availableHeight) {
                finalHeight = availableHeight;
                finalWidth = availableHeight * ASPECT_RATIO;
            }

            pongCanvas.value.width = BASE_WIDTH;
            pongCanvas.value.height = BASE_HEIGHT;

            pongCanvas.value.style.width = `${finalWidth - 10}px`;
            pongCanvas.value.style.height = `${finalHeight - 10}px`;
            
            pongCanvas.value.parentElement.style.width = `${finalWidth}px`;
            pongCanvas.value.parentElement.style.height = `${finalHeight}px`;

            renderFrame();
        };

        const startMatch = () => {
            scores.p1 = 0;
            scores.p2 = 0;
            p1.y = (BASE_HEIGHT / 2) - (paddleHeight / 2);
            p2.y = (BASE_HEIGHT / 2) - (paddleHeight / 2);
            
            gameState.running = true;
            gameState.gameOver = false;
            winner.value = null;

            initBall(Math.random() > 0.5 ? 1 : -1);

            nextTick(() => {
                handleResize();
                gameLoop();
            });
        };

        const handleKeyDown = (e) => {
            keysPressed[e.key] = true;
            keysPressed[e.code] = true; 
        };

        const handleKeyUp = (e) => {
            keysPressed[e.key] = false;
            keysPressed[e.code] = false;
        };

        // Low-Latency Direct Touch Ingestion Bridge
        const bindTouch = (keyId, isPressed) => {
            keysPressed[keyId] = isPressed;
        };

        onMounted(() => {
            ctx = pongCanvas.value.getContext('2d');
            
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            window.addEventListener('resize', handleResize);

            setTimeout(() => {
                handleResize();
            }, 60);
        });

        onUnmounted(() => {
            cancelAnimationFrame(requestId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize);
        });

        return {
            pongCanvas, arenaWrapper,
            scores, gameState, winner,
            startMatch, bindTouch
        };
    }
}).mount('#app');
