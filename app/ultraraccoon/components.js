const GameComponents = {
    // --- CORE PLATFORMING ---
    createNeonPlatform: function(scene, x, y, width, height, color = 0x1e293b, trimColor = 0x6366f1) {
        const base = scene.add.rectangle(x, y, width, height, color);
        scene.physics.add.existing(base, true);
        scene.add.rectangle(x, y - (height / 2), width, 4, trimColor).setOrigin(0.5);
        if (scene.platforms) scene.platforms.add(base);
        return base;
    },

    createMovingPlatform: function(scene, x, y, width, distance = 300, duration = 2000) {
        const platform = scene.add.rectangle(x, y, width, 30, 0x94a3b8);
        scene.physics.add.existing(platform, false);
        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);

        scene.tweens.add({
            targets: platform,
            x: x + distance,
            duration: duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        scene.physics.add.collider(scene.player, platform);
        return platform;
    },

    createCrumblingPlatform: function(scene, x, y, width) {
        const platform = scene.add.rectangle(x, y, width, 30, 0xf87171);
        scene.physics.add.existing(platform, true);
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

    // --- HAZARDS & TRIGGERS ---
    createKillZone: function(scene, x, y, width, height, visible = false) {
        const zone = scene.add.rectangle(x, y, width, height, 0xff0000, visible ? 0.3 : 0);
        scene.physics.add.existing(zone, true);
        scene.physics.add.overlap(scene.player, zone, () => {
            if (scene.player && !scene.player.isDead) scene.player.die();
        });
            return zone;
    },

    createJumpPad: function(scene, x, y, width = 60) {
        const pad = scene.add.rectangle(x, y, width, 15, 0x10b981);
        scene.physics.add.existing(pad, true);
        pad.body.setSize(width, 20);
        scene.physics.add.overlap(scene.player, pad, () => {
            if (scene.player) scene.player.setVelocityY(-1000);
        });
            return pad;
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

    // Add this or update your existing GameComponents.createGoal
    createGoal: function(scene, x, y, nextSceneKey) {
        const goal = scene.add.rectangle(x, y, 100, 200, 0xfacc15, 0.5);
        scene.physics.add.existing(goal, true);

        scene.physics.add.overlap(scene.player, goal, () => {
            if (scene.player && !scene.player.isDead) {
                // Lock player controls
                scene.player.isDead = true;
                scene.player.setVelocity(0, 0);
                scene.player.setAcceleration(0, 0);

                // Victory Text
                scene.add.text(x, y - 150, "SYSTEM CLEAR", {
                    font: "900 48px monospace",
                    fill: "#facc15"
                }).setOrigin(0.5);

                // Transition to Level 2 after 2 seconds
                scene.time.delayedCall(2000, () => {
                    scene.scene.start(nextSceneKey);
                });
            }
        });
        return goal;
    },


    // --- EXPERIMENTAL & UTILITY ---
    createWindFan: function(scene, x, y, width, height, force = -1200) {
        const zone = scene.add.rectangle(x, y, width, height, 0x00f2ff, 0.1);
        scene.physics.add.existing(zone, true);
        scene.physics.add.overlap(scene.player, zone, () => {
            scene.player.body.setAccelerationY(force);
        });
        scene.events.on('update', () => {
            if (scene.player && scene.player.body && !scene.physics.overlap(scene.player, zone)) {
                if (scene.player.body.acceleration.y === force) scene.player.body.setAccelerationY(0);
            }
        });
        return zone;
    },

    createTrampoline: function(scene, x, y, width = 80) {
        const tramp = scene.add.rectangle(x, y, width, 10, 0xff00ff);
        scene.physics.add.existing(tramp, true);
        scene.physics.add.collider(scene.player, tramp, () => {
            scene.player.setVelocityY(-1200);
        });
        return tramp;
    },

    createTeleporter: function(scene, x1, y1, x2, y2) {
        const pad1 = scene.add.circle(x1, y1, 30, 0x6366f1, 0.5);
        const pad2 = scene.add.circle(x2, y2, 30, 0x6366f1, 0.5);
        scene.physics.add.existing(pad1, true);
        let coolingDown = false;
        scene.physics.add.overlap(scene.player, pad1, () => {
            if (!coolingDown) {
                scene.player.setPosition(x2, y2);
                coolingDown = true;
                scene.time.delayedCall(1000, () => coolingDown = false);
            }
        });
        return pad1;
    },

    createElevator: function(scene, x, y, distance = 300, duration = 3000) {
        const lift = scene.add.rectangle(x, y, 100, 20, 0x64748b);
        scene.physics.add.existing(lift, false);
        lift.body.setAllowGravity(false).setImmovable(true);
        scene.tweens.add({
            targets: lift,
            y: y - distance,
            duration: duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        scene.physics.add.collider(scene.player, lift);
        return lift;
    },

    createIcePatch: function(scene, x, y, width) {
        const ice = scene.add.rectangle(x, y, width, 10, 0x93c5fd, 0.6);
        scene.physics.add.existing(ice, true);
        scene.physics.add.overlap(scene.player, ice, () => {
            if (scene.player) {
                scene.player.setDragX(0);
                scene.player.setTint(0x93c5fd);
            }
        });

        scene.events.on('update', () => {
            if (scene.player && !scene.physics.overlap(scene.player, ice)) {
                if (scene.player.body.drag.x === 0) {
                    scene.player.setDragX(400);
                    scene.player.clearTint();
                }
            }
        });
        return ice;
    },

    createPickUp: function(scene, x, y, onCollect) {
        const item = scene.add.circle(x, y, 15, 0xfde047);
        scene.physics.add.existing(item, true);
        scene.tweens.add({ targets: item, y: y - 10, yoyo: true, repeat: -1 });
        scene.physics.add.overlap(scene.player, item, () => {
            item.destroy();
            if (onCollect) onCollect();
        });
            return item;
    }
};
