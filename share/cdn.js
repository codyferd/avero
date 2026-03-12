const libs = [
    "https://cdn.tailwindcss.com",
"https://cdn.jsdelivr.net/npm/vue@3.5.30/dist/vue.global.prod.js",
"https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js",
"https://cdn.jsdelivr.net/npm/chess.js@0.12.1/chess.min.js", // Do Not Update
"https://cdn.jsdelivr.net/npm/mathjs@15.1.1/lib/browser/math.js",
];
libs.forEach(src => {
    document.write(`<script src="${src}"></script>`);
});
