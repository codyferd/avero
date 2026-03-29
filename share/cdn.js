const libs = [
// Local
"../../share/theme.css",
"../../share/storage.js",
// Style
"https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css",
"https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.css",
// Script
"https://cdn.tailwindcss.com",
"https://cdn.jsdelivr.net/npm/vue@3.5.30/dist/vue.global.prod.js",
"https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js",
"https://cdn.jsdelivr.net/npm/chess.js@0.12.1/chess.min.js", // Do Not Update
"https://cdn.jsdelivr.net/npm/mathjs@15.1.1/lib/browser/math.js",
"https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js",
"https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js",
];

libs.forEach(url => {
    if (url.endsWith('.css')) {
        document.write(`<link rel="stylesheet" href="${url}">`);
    } else {
        document.write(`<script src="${url}"></script>`);
    }
});
