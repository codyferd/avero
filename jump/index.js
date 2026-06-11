window.gameApp = Vue.createApp({
    data: function() {
        return {
            gameState: "start",
            score: 0,
            high: localStorage.getItem("averojump_hi") || 0,
            view: "",
            btn: { u: false, d: false },
            settings: JSON.parse(localStorage.getItem("averojump_cfg")) || JSON.parse(JSON.stringify(DEFAULTS)),
            fields: [
                { n: "Gap", k: "gapSize", min: 100, max: 400 },
                { n: "Aggro", k: "enemyIntensity", min: 0, max: 100 },
                { n: "Drift", k: "extremity", min: 0, max: 100 },
                { n: "Speed+", k: "speedStep", min: 0, max: 100 },
            ],
            themes: ["classic", "neon", "dark", "synth"],
            presets: PRESETS,
        };
    },
    watch: {
        score: function(e) {
            if (e > this.high) {
                this.high = e;
                localStorage.setItem("averojump_hi", e);
            }
        },
        settings: {
            handler: function() {
                localStorage.setItem("averojump_cfg", JSON.stringify(this.settings));
            },
            deep: true,
        },
    },
    methods: {
        refresh: function() {
            var e = this.game.scene.getScene("MainGame");
            if (e && typeof e.updateTextures === "function") {
                e.updateTextures();
            }
        },
        applyStyle: function(e) {
            this.settings.colors = Object.assign({}, THEMES[e]);
            this.refresh();
        },
        applyDiff: function(e) {
            this.settings = Object.assign({}, this.settings, JSON.parse(JSON.stringify(PRESETS[e])));
            this.refresh();
        },
        handlePrimary: function() {
            if (this.gameState === "paused") {
                this.gameState = "playing";
                this.game.scene.resume("MainGame");
            } else {
                this.score = 0;
                this.gameState = "playing";
                const mainGame = this.game.scene.getScene("MainGame");
                if (mainGame) {
                    mainGame.scene.restart();
                }
            }
        },
        togglePause: function() {
            if (this.gameState === "playing") {
                this.gameState = "paused";
                this.game.scene.pause("MainGame");
            } else {
                this.handlePrimary();
            }
        },
        resetConfig: function() {
            localStorage.removeItem("averojump_cfg");
            location.reload();
        },
    },
    mounted: function() {
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: "game-container",
            width: window.innerWidth,
            height: window.innerHeight,
            scale: { mode: Phaser.Scale.RESIZE },
            physics: { default: "arcade" },
            scene: MainGame,
        });

        window.addEventListener("pointerup", () => {
            this.btn.u = this.btn.d = false;
        });
    },
}).mount("#app");
