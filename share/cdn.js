// cdn.js

const LIB_MAP = {
    local: [
        "../../share/theme.css",
        "../../share/storage.js",
    ],
    leaflet: [
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css",
        "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.css",
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js",
        "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js",
    ],
    tailwind: "https://cdn.tailwindcss.com",
    vue: "https://cdn.jsdelivr.net/npm/vue@3.5.31/dist/vue.global.prod.js",
    phaser: "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js",
    math: "https://cdn.jsdelivr.net/npm/mathjs@15.1.1/lib/browser/math.js",
    chess: "https://cdn.jsdelivr.net/npm/chess.js@0.12.1/chess.min.js", // Do Not Update
    three: "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js" // Do Not Update
};

// 1. Get the script tag that called this file
const currentScript = document.currentScript;
const requested = currentScript.getAttribute('libs');

if (requested) {
    // 2. Turn "local,tailwind,vue,chess" into an array ['local', 'tailwind'...]
    const keys = requested.split(',').map(item => item.trim());

    keys.forEach(key => {
        const entry = LIB_MAP[key];
        if (!entry) return;

        // Handle both single strings and arrays of URLs
        const urls = Array.isArray(entry) ? entry : [entry];

        urls.forEach(url => {
            if (url.endsWith('.css')) {
                document.write(`<link rel="stylesheet" href="${url}">`);
            } else {
                document.write(`<script src="${url}"></script>`);
            }
        });
    });
}

