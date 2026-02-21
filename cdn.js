const libs = [
    "https://cdn.tailwindcss.com",
"https://cdn.jsdelivr.net/npm/vue/dist/vue.global.prod.js",
"https://cdn.jsdelivr.net/npm/phaser/dist/phaser.min.js",
"https://cdn.jsdelivr.net/npm/chess.js@0.12.1/chess.min.js",
"https://cdn.jsdelivr.net/npm/mathjs/lib/browser/math.js"
];

libs.forEach(src => {
    document.write(`<script src="${src}"></script>`);
});
