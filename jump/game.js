class MainGame extends Phaser.Scene {
    constructor() {
        super("MainGame");
        this.score = 0;
        this.spd = 500;
    }

    create() {
        const app = window.gameApp;
        this.score = 0;
        this.spd = 500;

        this.cameras.main.setBackgroundColor(app.settings.colors.bg);

        // Generate base dynamic textures safely
        this.gen();

        // Setup Particles (Player Trail)
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

        // Instantiated pooled game objects
        this.pipes = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Object Pool Implementation: Spawn a fixed, static set of pipes to cycle continuously
        const pipeSpacing = 450;
        for (let i = 0; i < 5; i++) {
            this.createPipePair(800 + pipeSpacing * i);
        }

        // Collisions
        this.physics.add.collider(this.bird, this.pipes, () => this.die());
        this.physics.add.overlap(this.bird, this.enemies, () => this.die());

        // Enhanced Keyboard Layout Listeners
        this.keys = this.input.keyboard.addKeys("A,D,W,S,UP,DOWN,SPACE");

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

        if (app.gameState !== "playing") {
            this.scene.pause();
        }
    }

    gen() {
        const colors = window.gameApp.settings.colors;
        const hexToNum = (hex) => parseInt(hex.replace("#", "0x")) || 0xffffff;

        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        graphics.fillStyle(hexToNum(colors.bird)).fillRect(0, 0, 32, 32);
        graphics.generateTexture("bird", 32, 32);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.pipe)).fillRect(0, 0, 60, 1200);
        graphics.generateTexture("pipe", 60, 1200);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.enemy)).fillRect(0, 0, 32, 32);
        graphics.generateTexture("enemy", 32, 32);
        
        graphics.destroy();
    }

    // Safely update textures at runtime without dropping references
    updateTextures() {
        const colors = window.gameApp.settings.colors;
        this.cameras.main.setBackgroundColor(colors.bg);
        
        const hexToNum = (hex) => parseInt(hex.replace("#", "0x")) || 0xffffff;

        ["bird", "pipe", "enemy"].forEach((key) => {
            let tex = this.textures.get(key);
            if (tex && tex.getSourceImage()) {
                let img = tex.getSourceImage();
                let ctx = img.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, img.width, img.height);
                    ctx.fillStyle = colors[key] || "#ffffff";
                    ctx.fillRect(0, 0, img.width, img.height);
                    tex.refresh();
                }
            }
        });
    }

    createPipePair(xPos) {
        const app = window.gameApp;
        const gap = app.settings.gapSize;
        const extreme = app.settings.extremity / 100;

        const range = this.scale.height / 2 - gap / 2 - 50;
        const offset = Phaser.Math.Between(-range * extreme, range * extreme);
        const centerY = this.scale.height / 2 + offset;

        let topPipe = this.pipes.create(xPos, centerY - gap / 2, "pipe").setOrigin(0.5, 1);
        let bottomPipe = this.pipes.create(xPos, centerY + gap / 2, "pipe").setOrigin(0.5, 0);

        [topPipe, bottomPipe].forEach((p) => {
            p.body.allowGravity = false;
            p.setVelocityX(-this.spd);
        });

        topPipe.scored = false;
        // Bind references together to allow high performance recycling mechanics
        topPipe.partner = bottomPipe;
        bottomPipe.partner = topPipe;
    }

    addE() {
        const app = window.gameApp;
        if (app.gameState !== "playing" || app.settings.enemyIntensity === 0) return;

        let enemy = this.enemies.getFirstDead(false);
        
        if (!enemy) {
            enemy = this.enemies.create(this.scale.width + 100, Phaser.Math.Between(100, this.scale.height - 100), "enemy");
        } else {
            enemy.setActive(true).setVisible(true);
            enemy.setPosition(this.scale.width + 100, Phaser.Math.Between(100, this.scale.height - 100));
        }

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

        // Unified Input
        const moveUp = this.keys.A.isDown || this.keys.W.isDown || this.keys.UP.isDown || this.keys.SPACE.isDown || app.btn.u;
        const moveDown = this.keys.D.isDown || this.keys.S.isDown || this.keys.DOWN.isDown || app.btn.d;

        if (moveUp) {
            this.bird.setVelocityY(-1000);
        } else if (moveDown) {
            this.bird.setVelocityY(1000);
        } else {
            this.bird.setVelocityY(0);
        }

        // Get rightmost pipe coordinate to chain endless recycling seamlessly
        let rightmostX = 0;
        this.pipes.getChildren().forEach((p) => {
            if (p.x > rightmostX) rightmostX = p.x;
        });

        // Track and process score & object pooling transformations
        this.pipes.getChildren().forEach((p) => {
            p.setVelocityX(-this.spd);

            if (p.originY === 1 && !p.scored && p.x < this.bird.x) {
                p.scored = true;
                app.score++;
            }

            // Object pool loop logic: recycle when offscreen
            if (p.x < -100) {
                if (p.originY === 1) {
                    const gap = app.settings.gapSize;
                    const extreme = app.settings.extremity / 100;
                    const range = this.scale.height / 2 - gap / 2 - 50;
                    const offset = Phaser.Math.Between(-range * extreme, range * extreme);
                    const centerY = this.scale.height / 2 + offset;

                    // Relocate to the end of the line
                    p.x = rightmostX + 450;
                    p.y = centerY - gap / 2;
                    p.scored = false;

                    if (p.partner) {
                        p.partner.x = p.x;
                        p.partner.y = centerY + gap / 2;
                    }
                }
            }
        });

        // Enemy recycling clean logs
        this.enemies.getChildren().forEach((e) => {
            if (!e.active) return;
            
            if (e.iq > 50) {
                const diff = this.bird.y - e.y;
                e.setVelocityY(Phaser.Math.Clamp(diff, -450, 450));
            } else {
                e.setVelocityY(Math.sin(time / 200) * e.iq * 10);
            }

            if (e.x < -200) {
                e.setActive(false).setVisible(false);
                e.setVelocity(0, 0);
            }
        });
    }
}
