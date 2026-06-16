const { createApp, ref, onMounted, onUnmounted, nextTick } = Vue;

createApp({
    setup() {
        const gameState = ref('START'); // START, RUNNING, GAMEOVER
        const score = ref(0);
        const highScore = ref(parseInt(localStorage.getItem('averohop_highscore')) || 0);
        const speedMultiplier = ref(1.0);

        // SLIDER CONTROL MATRICES
        const configHeight = ref(36);       
        const configRandomness = ref(50);   
        const configIntervalSpread = ref(40); // New spacing randomization variable

        let canvas, ctx;
        let animationFrameId = null;

        // VIRTUAL GRID BOUNDS
        const V_WIDTH = 800;
        const V_HEIGHT = 240;
        const GROUND_Y = 200;

        // ENTITY CONSTRUCTS
        const player = {
            x: 80,
            y: GROUND_Y - 32,
            w: 24,
            h: 32,
            vy: 0,
            gravity: 0.6,
            jumpForce: -11.5,
            isGrounded: false,
            rotation: 0
        };

        let obstacles = [];
        let particles = [];
        
        let baseSpeed = 5.5;
        let obstacleSpawnTimer = 0;
        let nextSpawnInterval = 100;

        const initCanvas = () => {
            canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            resizeCanvas();
            
            // Start the infinite UI loop system regardless of current state
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            masterLoop();
        };

        const resizeCanvas = () => {
            if (!canvas || !ctx) return;
            const container = canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            
            // Check if container metrics exist before updating canvas dimensions
            if (rect.width > 0 && rect.height > 0) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
            }
        };

        // RENDER CONTEXT CALCULATION UTILITIES (Safely tracking live client footprints)
        const getScaleX = () => {
            const dpr = window.devicePixelRatio || 1;
            return (canvas.width / dpr) / V_WIDTH;
        };
        const getScaleY = () => {
            const dpr = window.devicePixelRatio || 1;
            return (canvas.height / dpr) / V_HEIGHT;
        };

        const startGame = () => {
            gameState.value = 'RUNNING';
            score.value = 0;
            speedMultiplier.value = 1.0;
            obstacles = [];
            particles = [];
            
            player.y = GROUND_Y - player.h;
            player.vy = 0;
            player.isGrounded = true;
            player.rotation = 0;
            
            obstacleSpawnTimer = 0;
            nextSpawnInterval = 80;
        };

        const triggerJump = () => {
            if (gameState.value !== 'RUNNING') return;
            if (player.isGrounded) {
                player.vy = player.jumpForce;
                player.isGrounded = false;
                
                for (let i = 0; i < 6; i++) {
                    particles.push({
                        x: player.x + player.w / 2,
                        y: player.y + player.h,
                        vx: -1 - Math.random() * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: Math.random() * 3 + 1,
                        alpha: 1,
                        color: 'rgba(99, 102, 241, 0.6)'
                    });
                }
            }
        };

        const handleInput = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                if (gameState.value === 'RUNNING') triggerJump();
                else if (gameState.value === 'START' || gameState.value === 'GAMEOVER') startGame();
            }
        };

        const spawnObstacle = () => {
            const baseMaxHeight = configHeight.value;
            const randomnessFactor = configRandomness.value / 100;

            let ow = 16;
            let oh = baseMaxHeight;

            if (randomnessFactor > 0) {
                const variance = (Math.random() * baseMaxHeight * randomnessFactor);
                // Upper limit constraints modified to allow scaling up to 120 pixels comfortably
                oh = Math.max(16, Math.min(120, baseMaxHeight - (variance * 0.5) + (Math.random() > 0.5 ? variance * 0.5 : -variance * 0.3)));
                ow = Math.max(12, Math.min(36, 20 + (Math.random() - 0.5) * 12 * randomnessFactor));
            }

            obstacles.push({
                x: V_WIDTH,
                y: GROUND_Y - Math.round(oh),
                w: Math.round(ow),
                h: Math.round(oh),
                color: Math.random() > 0.6 ? '#818cf8' : '#6366f1'
            });
        };

        // MASTER ENGINE SYSTEM LOOP
        const masterLoop = () => {
            if (gameState.value === 'RUNNING') {
                updatePhysics();
            }
            
            // Render graphics every frame across ALL game states
            renderFrames();
            animationFrameId = requestAnimationFrame(masterLoop);
        };

        const updatePhysics = () => {
            score.value += 0.15;
            speedMultiplier.value = 1.0 + Math.floor(score.value / 250) * 0.12;
            const currentSpeed = baseSpeed * speedMultiplier.value;

            player.vy += player.gravity;
            player.y += player.vy;

            if (player.y >= GROUND_Y - player.h) {
                player.y = GROUND_Y - player.h;
                player.vy = 0;
                player.isGrounded = true;
                player.rotation = 0;
            } else {
                player.rotation += 0.07;
            }

            obstacleSpawnTimer++;
            if (obstacleSpawnTimer >= nextSpawnInterval) {
                spawnObstacle();
                obstacleSpawnTimer = 0;
                
                // Base dynamic spacing calculated against acceleration metrics
                const baseInterval = 65 - (speedMultiplier.value * 10);
                const varianceRange = 50 * (configIntervalSpread.value / 100);
                
                nextSpawnInterval = baseInterval + (Math.random() * varianceRange * 2 - varianceRange);
                
                // Hard guard checking to ensure hurdles don't stack directly on top of each other
                if (nextSpawnInterval < 35) nextSpawnInterval = 35;
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.x -= currentSpeed;

                if (
                    player.x < obs.x + obs.w &&
                    player.x + player.w > obs.x &&
                    player.y < obs.y + obs.h &&
                    player.y + player.h > obs.y
                ) {
                    gameState.value = 'GAMEOVER';
                    triggerImpactExplosion();
                    if (score.value > highScore.value) {
                        highScore.value = Math.floor(score.value);
                        localStorage.setItem('averohop_highscore', highScore.value);
                    }
                    return;
                }

                if (obs.x + obs.w < 0) {
                    obstacles.splice(i, 1);
                }
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;
                if (p.alpha <= 0) particles.splice(i, 1);
            }
        };

        const triggerImpactExplosion = () => {
            for (let i = 0; i < 35; i++) {
                particles.push({
                    x: player.x + player.w / 2,
                    y: player.y + player.h / 2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.7) * 12,
                    size: Math.random() * 4 + 2,
                    alpha: 1,
                    color: i % 2 === 0 ? '#ef4444' : '#6366f1'
                });
            }
        };

        const renderFrames = () => {
            if (!canvas || !ctx) return;
            
            // Clean context frame parameters perfectly
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const dpr = window.devicePixelRatio || 1;
            const sX = getScaleX() * dpr;
            const sY = getScaleY() * dpr;

            // Block rendering if dimensions resolve to 0 during scaling mutations
            if (canvas.width === 0 || canvas.height === 0) return;

            ctx.save();
            ctx.scale(sX, sY);

            // 1. Draw Ground
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y);
            ctx.lineTo(V_WIDTH, GROUND_Y);
            ctx.stroke();

            ctx.strokeStyle = '#4338ca';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, GROUND_Y + 4);
            ctx.lineTo(V_WIDTH, GROUND_Y + 4);
            ctx.stroke();

            // 2. Draw Obstacles
            obstacles.forEach(obs => {
                ctx.fillStyle = obs.color;
                ctx.shadowBlur = 12;
                ctx.shadowColor = obs.color;
                ctx.beginPath();
                ctx.roundRect(obs.x, obs.y, obs.w, obs.h, [4, 4, 0, 0]);
                ctx.fill();
                ctx.shadowBlur = 0; 
            });

            // 3. Draw Engine Particles
            particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 4. Draw Player
            if (gameState.value !== 'GAMEOVER') {
                ctx.save();
                ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
                ctx.rotate(player.rotation);
                
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#6366f1';
                ctx.beginPath();
                ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 6);
                ctx.fill();

                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 8;
                ctx.fillRect(2, -10, 8, 3);

                ctx.restore();
            }

            ctx.restore();
        };

        const formatScore = (val) => String(Math.floor(val)).padStart(5, '0');

        onMounted(() => {
            // Wait for Tailwind UI layout to finalize node dimensions
            nextTick(() => {
                setTimeout(() => {
                    initCanvas();
                    window.addEventListener('resize', resizeCanvas);
                    window.addEventListener('keydown', handleInput);
                }, 100);
            });
            
            const container = document.getElementById('game-container');
            if (container) {
                container.addEventListener('touchstart', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    e.preventDefault();
                    if (gameState.value === 'RUNNING') triggerJump();
                    else startGame();
                }, { passive: false });

                container.addEventListener('mousedown', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    if (gameState.value === 'RUNNING') triggerJump();
                });
            }
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        });

        return {
            gameState, score, highScore, speedMultiplier,
            configHeight, configRandomness, configIntervalSpread,
            startGame, formatScore
        };
    }
}).mount('#app');
