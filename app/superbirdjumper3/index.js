window.gameApp = Vue.createApp({
    data: function() {
        return {
            gameState: "start",
            score: 0,
            high: localStorage.getItem("sbj3_hi") || 0,
                               view: "",
                               btn: { u: false, d: false },
                               // Assumes DEFAULTS is a global constant
                               settings: JSON.parse(localStorage.getItem("sbj3_cfg")) || JSON.parse(JSON.stringify(DEFAULTS)),
                               fields: [
                                   { n: "Gap", k: "gapSize", min: 100, max: 400 },
                                   { n: "Aggro", k: "enemyIntensity", min: 0, max: 100 },
                                   { n: "Drift", k: "extremity", min: 0, max: 100 },
                                   { n: "Speed+", k: "speedStep", min: 0, max: 100 },
                               ],
                               themes: ["classic", "neon", "dark", "synth"],
                               // Assumes PRESETS is a global constant
                               presets: PRESETS,
        };
    },
    watch: {
        score: function(e) {
            if (e > this.high) {
                this.high = e;
                localStorage.setItem("sbj3_hi", e);
            }
        },
        settings: {
            handler: function() {
                localStorage.setItem("sbj3_cfg", JSON.stringify(this.settings));
            },
            deep: true,
        },
    },
    methods: {
        refresh: function() {
            var e = this.game.scene.getScene("MainGame");
            if (e) {
                e.cameras.main.setBackgroundColor(this.settings.colors.bg);
                ["bird", "pipe", "enemy"].forEach(function(t) {
                    if (e.textures.exists(t)) e.textures.remove(t);
                });
                    e.gen();
                    e.bird.setTexture("bird");
                    e.pts.texture = e.textures.get("bird");
                    e.pipes.getChildren().forEach(function(p) { p.setTexture("pipe"); });
                    e.enemies.getChildren().forEach(function(en) { en.setTexture("enemy"); });
            }
        },
        applyStyle: function(e) {
            // Assumes THEMES is a global constant
            this.settings.colors = Object.assign({}, THEMES[e]);
            this.refresh();
        },
        applyDiff: function(e) {
            this.settings = Object.assign({}, this.settings, JSON.parse(JSON.stringify(PRESETS[e])));
        },
        handlePrimary: function() {
            if (this.gameState === "paused") {
                this.gameState = "playing";
                this.game.scene.resume("MainGame");
            } else {
                this.score = 0;
                this.gameState = "playing";
                this.game.scene.getScene("MainGame").scene.restart();
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
            localStorage.removeItem("sbj3_cfg");
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
            scene: MainGame, // Global variable from your Phaser scene file
        });

        window.addEventListener("pointerup", () => {
            this.btn.u = this.btn.d = false;
        });
    },
}).mount("#app");
