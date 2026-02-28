export class MainGame extends Phaser.Scene {
    constructor() {
        super("MainGame");
    }
    create() {
        const e = window.gameApp;
        (this.score = 0),
        (this.spd = 500),
        this.cameras.main.setBackgroundColor(e.settings.colors.bg),
        this.gen(),
        (this.pts = this.add.particles(0, 0, "bird", {
            speed: 80,
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 400,
            blendMode: "ADD",
        })),
        (this.bird = this.physics.add.sprite(200, this.scale.height / 2, "bird").setCollideWorldBounds(!0)),
        (this.bird.body.allowGravity = !1),
        this.pts.startFollow(this.bird),
        (this.pipes = this.physics.add.group()),
        (this.enemies = this.physics.add.group());
        for (let e = 0; e < 6; e++) this.addP(800 + 500 * e);
        this.physics.add.collider(this.bird, this.pipes, () => this.die()),
        this.physics.add.overlap(this.bird, this.enemies, () => this.die()),
        (this.keys = this.input.keyboard.addKeys("A,D")),
        this.time.addEvent({
            delay: 1e4,
            callback: () => {
                "playing" === e.gameState && (this.spd += e.settings.speedStep);
            },
            loop: !0,
        }),
        this.time.addEvent({ delay: 2e3, callback: () => this.addE(), loop: !0 }),
        "playing" !== e.gameState && this.scene.pause();
    }
    gen() {
        const e = window.gameApp.settings.colors,
        t = (e) => parseInt(e.replace("#", "0x")) || 16777215;
        let i = this.make.graphics({ x: 0, y: 0, add: !1 });
        i.fillStyle(t(e.bird)).fillRect(0, 0, 32, 32).generateTexture("bird", 32, 32),
        i.clear().fillStyle(t(e.pipe)).fillRect(0, 0, 60, 1200).generateTexture("pipe", 60, 1200),
        i.clear().fillStyle(t(e.enemy)).fillRect(0, 0, 32, 32).generateTexture("enemy", 32, 32);
    }
    addP(e) {
        const t = window.gameApp,
        i = t.settings.gapSize,
        s = t.settings.extremity / 100,
        a = this.scale.height / 2 - i / 2 - 50,
        d = this.scale.height / 2 + Phaser.Math.Between(-a * s, a * s);
        let h = this.pipes.create(e, d - i / 2, "pipe").setOrigin(0.5, 1);
        [h, this.pipes.create(e, d + i / 2, "pipe").setOrigin(0.5, 0)].forEach((e) => {
            (e.body.allowGravity = !1), e.setVelocityX(-this.spd);
        }),
        (h.ok = !1);
    }
    addE() {
        const e = window.gameApp;
        if ("playing" !== e.gameState || 0 === e.settings.enemyIntensity) return;
        let t = this.enemies.create(this.scale.width + 100, Phaser.Math.Between(100, this.scale.height - 100), "enemy");
        (t.body.allowGravity = !1), t.setVelocityX(-(this.spd + 200)), (t.iq = e.settings.enemyIntensity);
    }
    die() {
        (window.gameApp.gameState = "gameover"), this.scene.pause();
    }
    update(e) {
        const t = window.gameApp;
        if ("playing" !== t.gameState) return;
        const i = this.keys.A.isDown || t.btn.u,
        s = this.keys.D.isDown || t.btn.d;
        this.bird.setVelocityY(i ? -1e3 : s ? 1e3 : 0),
        this.pipes.getChildren().forEach((e) => {
            e.setVelocityX(-this.spd),
                                         1 === e.originY && !e.ok && e.x < this.bird.x && ((e.ok = !0), t.score++),
                                         e.x < -100 && (1 === e.originY && this.addP(e.x + 3e3), e.destroy());
        }),
        this.enemies.getChildren().forEach((t) => {
            t.iq > 50
            ? t.setVelocityY(Phaser.Math.Clamp(this.bird.y - t.y, -450, 450))
            : t.setVelocityY(Math.sin(e / 200) * t.iq * 10),
                                           t.x < -200 && t.destroy();
        });
    }
}
