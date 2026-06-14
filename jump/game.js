class MainGame extends Phaser.Scene {
    constructor() {
        super("MainGame");
        this.score = 0;
        this.spd = 500;
    }

    create() {
        const app = window.gameApp;
        this.score = 0;
        // Inject baseline speed parameter safely
        this.spd = app.settings.baseSpeed !== undefined ? app.settings.baseSpeed : 500;

        this.cameras.main.setBackgroundColor(app.settings.colors.bg);

        // Clear pre-existing textures to bypass duplication issues on runtime re-generation
        if (this.textures.exists("bird")) this.textures.remove("bird");
        if (this.textures.exists("pipe")) this.textures.remove("pipe");
        if (this.textures.exists("enemy")) this.textures.remove("enemy");

        this.gen();

        // Setup Particles
        this.pts = this.add.particles(0, 0, "bird", {
            speed: 80,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 400,
            blendMode: "ADD",
        });

        // Setup Player using newly supplied scale metrics
        const bSize = app.settings.birdSize || 32;
        this.bird = this.physics.add.sprite(200, this.scale.height / 2, "bird");
        this.bird.setDisplaySize(bSize, bSize);
        this.bird.setCollideWorldBounds(true);
        this.bird.body.allowGravity = false;
        this.pts.startFollow(this.bird);

        this.pipes = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Standardized spacing adjusted for fixed horizontal window
        const pipeSpacing = 400;
        for (let i = 0; i < 5; i++) {
            this.createPipePair(900 + pipeSpacing * i);
        }

        this.physics.add.collider(this.bird, this.pipes, () => this.die());
        this.physics.add.overlap(this.bird, this.enemies, () => this.die());

        this.keys = this.input.keyboard.addKeys("A,D,W,S,UP,DOWN,SPACE");

        // Progression acceleration
        this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (app.gameState === "playing") {
                    this.spd += app.settings.speedStep;
                }
            },
            loop: true,
        });

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
        const app = window.gameApp;
        const colors = app.settings.colors;
        const hexToNum = (hex) => parseInt(hex.replace("#", "0x")) || 0xffffff;

        // Extract customized geometry sizes directly from configuration bounds
        const bSize = app.settings.birdSize || 32;
        const pWidth = app.settings.pipeWidth || 60;

        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        graphics.fillStyle(hexToNum(colors.bird)).fillRect(0, 0, bSize, bSize);
        graphics.generateTexture("bird", bSize, bSize);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.pipe)).fillRect(0, 0, pWidth, 1200);
        graphics.generateTexture("pipe", pWidth, 1200);

        graphics.clear();
        graphics.fillStyle(hexToNum(colors.enemy)).fillRect(0, 0, 32, 32);
        graphics.generateTexture("enemy", 32, 32);
        
        graphics.destroy();
    }

    updateTextures() {
        // Full recreate execution on structural variable mutations
        this.scene.restart();
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

        // Adjust dimensions dynamically out of pool
        const pWidth = app.settings.pipeWidth || 60;
        topPipe.setDisplaySize(pWidth, 1200);
        bottomPipe.setDisplaySize(pWidth, 1200);

        [topPipe, bottomPipe].forEach((p) => {
            p.body.allowGravity = false;
            p.body.immovable = true;
            p.setVelocityX(-this.spd);
        });

        topPipe.scored = false;
        topPipe.partner = bottomPipe;
        bottomPipe.partner = topPipe;
    }

    addE() {
        const app = window.gameApp;
        if (app.gameState !== "playing" || app.settings.enemyIntensity === 0) return;

        let enemy = this.enemies.getFirstDead(false);
        const spawnX = this.scale.width + 100;
        const spawnY = Phaser.Math.Between(100, this.scale.height - 100);
        
        if (!enemy) {
            enemy = this.enemies.create(spawnX, spawnY, "enemy");
        } else {
            enemy.setActive(true).setVisible(true);
            enemy.setPosition(spawnX, spawnY);
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

        const moveUp = this.keys.A.isDown || this.keys.W.isDown || this.keys.UP.isDown || this.keys.SPACE.isDown || app.btn.u;
        const moveDown = this.keys.D.isDown || this.keys.S.isDown || this.keys.DOWN.isDown || app.btn.d;

        if (moveUp) {
            this.bird.setVelocityY(-1000);
        } else if (moveDown) {
            this.bird.setVelocityY(1000);
        } else {
            // Apply adjustable gravity glide calculations when drifting idle
            const floatGravity = app.settings.gravity !== undefined ? app.settings.gravity : 0;
            this.bird.setVelocityY(floatGravity);
        }

        let rightmostX = 0;
        this.pipes.getChildren().forEach((p) => {
            if (p.x > rightmostX) rightmostX = p.x;
        });

        this.pipes.getChildren().forEach((p) => {
            p.setVelocityX(-this.spd);

            if (p.originY === 1 && !p.scored && p.x < this.bird.x) {
                p.scored = true;
                app.score++;
            }

            if (p.x < -100) {
                if (p.originY === 1) {
                    const gap = app.settings.gapSize;
                    const extreme = app.settings.extremity / 100;
                    const range = this.scale.height / 2 - gap / 2 - 50;
                    const offset = Phaser.Math.Between(-range * extreme, range * extreme);
                    const centerY = this.scale.height / 2 + offset;

                    p.x = rightmostX + 400; 
                    p.y = centerY - gap / 2;
                    p.scored = false;

                    if (p.partner) {
                        p.partner.x = p.x;
                        p.partner.y = centerY + gap / 2;
                    }
                }
            }
        });

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
