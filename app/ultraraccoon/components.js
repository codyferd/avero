const GameComponents = {

    createNeonPlatform: function(scene, x, y, width, height, color = 0x1e293b, trimColor = 0x6366f1) {
        const base = scene.add.rectangle(x, y, width, height, color);
        scene.physics.add.existing(base, true); // true = static

        // Visual trim
        scene.add.rectangle(x, y - (height / 2), width, 4, trimColor).setOrigin(0.5);

        if (scene.platforms) scene.platforms.add(base);
        return base;
    },

    createKillZone: function(scene, x, y, width, height, visible = false) {
        const zone = scene.add.rectangle(x, y, width, height, 0xff0000, visible ? 0.3 : 0);
        scene.physics.add.existing(zone, true);

        // Tighten the hitbox slightly so it doesn't feel "unfair"
        zone.body.setSize(width * 0.8, height * 0.8);

        scene.physics.add.overlap(scene.player, zone, () => {
            if (scene.player && !scene.player.isDead) scene.player.die();
        });
            return zone;
    },

    createJumpPad: function(scene, x, y, width = 60) {
        const pad = scene.add.rectangle(x, y, width, 15, 0x10b981);
        scene.physics.add.existing(pad, true);

        // Make the jump pad hitbox slightly taller so it registers before the floor collision
        pad.body.setSize(width, 20);

        scene.physics.add.overlap(scene.player, pad, () => {
            if (scene.player) scene.player.setVelocityY(-1000);
        });
            return pad;
    },

    createGoal: function(scene, x, y) {
        const goal = scene.add.rectangle(x, y, 100, 200, 0xfacc15, 0.5);
        scene.physics.add.existing(goal, true);

        scene.physics.add.overlap(scene.player, goal, () => {
            if (scene.player && !scene.player.isDead) {
                scene.player.setAnimation('victory');
                scene.player.setVelocity(0, 0);
                if (scene.player.body) scene.player.body.setAcceleration(0, 0);
                scene.add.text(x, y - 150, "SYSTEM CLEAR", { font: "900 48px monospace", fill: "#facc15" }).setOrigin(0.5);
            }
        });
        return goal;
    },

    createSpeedBoost: function(scene, x, y, direction = 1) {
        const boost = scene.add.rectangle(x, y, 80, 25, 0x06b6d4, 0.6);
        scene.physics.add.existing(boost, true);

        scene.add.text(x, y, direction > 0 ? ">>>" : "<<<", { font: "900 12px monospace", fill: "#ffffff" }).setOrigin(0.5);

        scene.physics.add.overlap(scene.player, boost, () => {
            if (scene.player) {
                scene.player.setVelocityX(1400 * direction);
                scene.player.setTint(0x06b6d4);
                scene.time.delayedCall(500, () => { if (scene.player) scene.player.clearTint(); });
            }
        });
        return boost;
    },

    createCrumblingPlatform: function(scene, x, y, width) {
        const platform = scene.add.rectangle(x, y, width, 30, 0xf87171);
        scene.physics.add.existing(platform, true);

        if (scene.platforms) scene.platforms.add(platform);

        scene.physics.add.collider(scene.player, platform, () => {
            if (platform.active && platform.alpha === 1) {
                scene.tweens.add({ targets: platform, alpha: 0.5, duration: 100, yoyo: true, repeat: 3 });
                scene.time.delayedCall(500, () => {
                    platform.active = false;
                    platform.destroy();
                });
            }
        });
        return platform;
    },

    createGravityWell: function(scene, x, y, width, height, force = 500) {
        const well = scene.add.rectangle(x, y, width, height, 0x8b5cf6, 0.1);
        scene.physics.add.existing(well, true);

        scene.physics.add.overlap(scene.player, well, () => {
            if (scene.player && scene.player.body) {
                scene.player.setAccelerationY(force);
                scene.player.isInsideWell = true;
            }
        });

        if (!scene.hasWellCleanup) {
            scene.events.on('update', () => {
                if (scene.player && scene.player.body) {
                    if (scene.player.isInsideWell && !scene.physics.overlap(scene.player, well)) {
                        scene.player.setAccelerationY(0);
                        scene.player.isInsideWell = false;
                    }
                }
            });
            scene.hasWellCleanup = true;
        }
        return well;
    },

    createMovingPlatform: function(scene, x, y, width, distance = 300, duration = 2000) {
        const platform = scene.add.rectangle(x, y, width, 30, 0x94a3b8);

        // CRITICAL FIX: Use a Dynamic Body, not a static one
        scene.physics.add.existing(platform, false);

        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true); // Player won't "push" it down
        platform.body.setFriction(1, 0); // Helps the player stick to it while it moves

        scene.tweens.add({
            targets: platform,
            x: x + distance,
            duration: duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Add a collider specifically for this platform so it works regardless of the group type
        scene.physics.add.collider(scene.player, platform);

        return platform;
    }
};

