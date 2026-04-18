// Avero OS - Phaser Scene Controller
// Assumes Phaser is loaded globally

class MainGame extends Phaser.Scene {
    constructor() {
        super("MainGame");
        this.score = 0;
        this.spd = 500;
    }

    create() {
        // Reference the global Vue app
        const app = window.gameApp;

        this.score = 0;
        this.spd = 500;

        // Sync background with Vue settings
        this.cameras.main.setBackgroundColor(app.settings.colors.bg);

        // Generate dynamic textures based on theme
        this.gen();

        // Setup Particles (Bird Trail)
        this.pts = this.add.particles(0, 0, "bird", {
            speed: 80,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 400,
            blendMode: "ADD",
        });

        // Setup Player
        this.bird = this.physics.add.sprite(200, this.scale.height / 2, "bird");
        this.bird.setCollideWorldBounds(true);
        this.bird.body.allowGravity = false;
        this.pts.startFollow(this.bird);

        // Groups
        this.pipes = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Initial pipe generation
        for (let i = 0; i < 6; i++) {
            this.addP(800 + 500 * i);
        }

        // Collisions
        this.physics.add.collider(this.bird, this.pipes, () => this.die());
        this.physics.add.overlap(this.bird, this.enemies, () => this.die());

        // Input
        this.keys = this.input.keyboard.addKeys("A,D");

        // Speed Progression Timer
        this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (app.gameState === "playing") {
                    this.spd += app.settings.speedStep;
                }
            },
            loop: true,
        });

        // Enemy Spawn Timer
        this.time.addEvent({
            delay: 2000,
            callback: () => this.addE(),
                           loop: true
        });

        // Start-state check
        if (app.gameState !== "playing") {
            this.scene.pause();
        }
    }

    gen() {
        const colors = window.gameApp.settings.colors;
        const hexToNum = (hex) => parseInt(hex.replace("#", "0x")) || 0xffffff;

        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Create textures on the fly so we don't need external assets
        graphics.fillStyle(hexToNum(colors.bird)).fillRect(0, 0, 32, 32);
        graphics.generateTexture("bird", 32, 32);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.pipe)).fillRect(0, 0, 60, 1200);
        graphics.generateTexture("pipe", 60, 1200);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.enemy)).fillRect(0, 0, 32, 32);
        graphics.generateTexture("enemy", 32, 32);
    }

    addP(xPos) {
        const app = window.gameApp;
        const gap = app.settings.gapSize;
        const extreme = app.settings.extremity / 100;

        const range = this.scale.height / 2 - gap / 2 - 50;
        const offset = Phaser.Math.Between(-range * extreme, range * extreme);
        const centerY = this.scale.height / 2 + offset;

        // Top Pipe
        let topPipe = this.pipes.create(xPos, centerY - gap / 2, "pipe").setOrigin(0.5, 1);
        // Bottom Pipe
        let bottomPipe = this.pipes.create(xPos, centerY + gap / 2, "pipe").setOrigin(0.5, 0);

        [topPipe, bottomPipe].forEach((p) => {
            p.body.allowGravity = false;
            p.setVelocityX(-this.spd);
        });

        topPipe.scored = false; // Custom property to track scoring
    }

    addE() {
        const app = window.gameApp;
        if (app.gameState !== "playing" || app.settings.enemyIntensity === 0) return;

        let enemy = this.enemies.create(
            this.scale.width + 100,
            Phaser.Math.Between(100, this.scale.height - 100),
                                        "enemy"
        );

        enemy.body.allowGravity = false;
        enemy.setVelocityX(-(this.spd + 200));
        enemy.iq = app.settings.enemyIntensity;
    }

    die() {
        window.gameApp.gameState = "gameover";
        this.scene.pause();
    }

    update(time, delta) {
        const app = window.gameApp;
        if (app.gameState !== "playing") return;

        // Input handling (Keyboard + Vue UI Buttons)
        const moveUp = this.keys.A.isDown || app.btn.u;
        const moveDown = this.keys.D.isDown || app.btn.d;

        if (moveUp) {
            this.bird.setVelocityY(-1000);
        } else if (moveDown) {
            this.bird.setVelocityY(1000);
        } else {
            this.bird.setVelocityY(0);
        }

        // Pipe Management & Scoring
        this.pipes.getChildren().forEach((p) => {
            p.setVelocityX(-this.spd);

            // Score if bird passes top pipe
            if (p.originY === 1 && !p.scored && p.x < this.bird.x) {
                p.scored = true;
                app.score++;
            }

            // Recycling pipes
            if (p.x < -100) {
                if (p.originY === 1) this.addP(p.x + 3000);
                p.destroy();
            }
        });

        // Enemy AI behavior
        this.enemies.getChildren().forEach((e) => {
            if (e.iq > 50) {
                // Tracking behavior
                const diff = this.bird.y - e.y;
                e.setVelocityY(Phaser.Math.Clamp(diff, -450, 450));
            } else {
                // Sinusoidal/Wave behavior
                e.setVelocityY(Math.sin(time / 200) * e.iq * 10);
            }

            if (e.x < -200) e.destroy();
        });
    }
}

