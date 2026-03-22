class Level1 extends Phaser.Scene {
    constructor() {
        super('Level1');
    }

    preload() {}

    create() {
        const { width, height } = this.scale;
        const worldWidth = 10000;

        // 1. Create Physics Groups
        this.platforms = this.physics.add.staticGroup();

        // 2. Initialize Player
        this.player = new Raccoon(this, 100, height - 250);

        // --- SECTION 1: THE WARMUP (0 - 2000) ---
        GameComponents.createNeonPlatform(this, 300, height - 100, 600, 60);
        GameComponents.createNeonPlatform(this, 800, height - 250, 200, 40, 0x1e293b, 0x06b6d4);

        // Horizontal Moving Platform
        GameComponents.createMovingPlatform(this, 1200, height - 350, 200, 400, 2500);

        GameComponents.createNeonPlatform(this, 1850, height - 450, 400, 40, 0x1e293b, 0x06b6d4);

        // --- SECTION 2: VELOCITY TEST (2000 - 4000) ---
        GameComponents.createSpeedBoost(this, 2100, height - 320, 1);

        // Main sliding track
        GameComponents.createNeonPlatform(this, 3300, height - 200, 2400, 40, 0x334155, 0xec4899);

        // Hazards and Mid-track boost
        [2800, 3400, 4000].forEach(x => {
            GameComponents.createKillZone(this, x, height - 230, 50, 30, true);
        });
        GameComponents.createSpeedBoost(this, 3100, height - 220, 1);

        // --- SECTION 3: VERTICAL ASCENT (4000 - 6000) ---
        GameComponents.createJumpPad(this, 4500, height - 400);

        GameComponents.createNeonPlatform(this, 5150, height - 650, 600, 40, 0x1e293b, 0xa855f7);
        GameComponents.createNeonPlatform(this, 5700, height - 450, 300, 40, 0x1e293b, 0x06b6d4);

        // --- SECTION 4: INSTABILITY ZONE (6000 - 8500) ---
        let startX = 6200;
        for(let i = 0; i < 5; i++) {
            GameComponents.createCrumblingPlatform(this, startX + (i * 450), height - (200 + (i * 100)), 150);
            GameComponents.createKillZone(this, startX + (i * 450) + 225, height + 50, 150, 100, true);
        }

        // --- SECTION 5: FINAL MOMENTUM (8500 - 10000) ---
        GameComponents.createJumpPad(this, 8400, height - 400);
        GameComponents.createNeonPlatform(this, 8800, height - 700, 400, 20, 0x334155, 0xfacc15);

        GameComponents.createSpeedBoost(this, 9100, height - 720, 1);

        GameComponents.createNeonPlatform(this, 9400, height - 550, 300, 20, 0x334155, 0xfacc15);
        GameComponents.createNeonPlatform(this, 9750, height - 200, 500, 60, 0x1e293b, 0x4f46e5);

        GameComponents.createKillZone(this, worldWidth / 2, height + 80, worldWidth, 100, true);
        GameComponents.createGoal(this, 9850, height - 320);

        // Physics & Camera
        this.physics.add.collider(this.player, this.platforms);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, worldWidth, height);
        this.physics.world.setBounds(0, 0, worldWidth, height);

        this.add.rectangle(0, 0, worldWidth, height, 0x000000).setOrigin(0).setDepth(-10);
    }

    update() {
        if (this.player && !this.player.isDead) {
            this.player.update();

            // Safety Fall-off check
            if (this.player.y > this.scale.height + 100) {
                this.player.die();
            }
        }
    }
}

