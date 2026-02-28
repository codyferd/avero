import { DEFAULTS, THEMES, PRESETS } from "./constants.js";
import { MainGame } from "./game.js";
const { createApp: createApp } = Vue;
window.gameApp = createApp({
    data: () => ({
        gameState: "start",
        score: 0,
        high: localStorage.getItem("sbj3_hi") || 0,
                 view: "",
                 btn: { u: !1, d: !1 },
                 settings: JSON.parse(localStorage.getItem("sbj3_cfg")) || JSON.parse(JSON.stringify(DEFAULTS)),
                 fields: [
                     { n: "Gap", k: "gapSize", min: 100, max: 400 },
                     { n: "Aggro", k: "enemyIntensity", min: 0, max: 100 },
                     { n: "Drift", k: "extremity", min: 0, max: 100 },
                     { n: "Speed+", k: "speedStep", min: 0, max: 100 },
                 ],
                 themes: ["classic", "neon", "dark", "synth"],
                 presets: PRESETS,
    }),
    watch: {
        score(e) {
            e > this.high && ((this.high = e), localStorage.setItem("sbj3_hi", e));
        },
        settings: {
            handler() {
                localStorage.setItem("sbj3_cfg", JSON.stringify(this.settings));
            },
            deep: !0,
        },
    },
    methods: {
        refresh() {
            const e = this.game.scene.getScene("MainGame");
            e &&
            (e.cameras.main.setBackgroundColor(this.settings.colors.bg),
             ["bird", "pipe", "enemy"].forEach((t) => {
                 e.textures.exists(t) && e.textures.remove(t);
             }),
             e.gen(),
             e.bird.setTexture("bird"),
             (e.pts.texture = e.textures.get("bird")),
             e.pipes.getChildren().forEach((e) => e.setTexture("pipe")),
             e.enemies.getChildren().forEach((e) => e.setTexture("enemy")));
        },
        applyStyle(e) {
            (this.settings.colors = { ...THEMES[e] }), this.refresh();
        },
        applyDiff(e) {
            this.settings = { ...this.settings, ...JSON.parse(JSON.stringify(PRESETS[e])) };
        },
        handlePrimary() {
            "paused" === this.gameState
            ? ((this.gameState = "playing"), this.game.scene.resume("MainGame"))
            : ((this.score = 0),
               (this.gameState = "playing"),
               this.game.scene.getScene("MainGame").scene.restart());
        },
        togglePause() {
            "playing" === this.gameState
            ? ((this.gameState = "paused"), this.game.scene.pause("MainGame"))
            : this.handlePrimary();
        },
        resetConfig() {
            localStorage.removeItem("sbj3_cfg"), location.reload();
        },
    },
    mounted() {
        (this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: "game-container",
            width: window.innerWidth,
            height: window.innerHeight,
            scale: { mode: Phaser.Scale.RESIZE },
            physics: { default: "arcade" },
            scene: MainGame,
        })),
        window.addEventListener("pointerup", () => (this.btn.u = this.btn.d = !1));
    },
}).mount("#app");
