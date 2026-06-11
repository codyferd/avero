const LIB_MAP = {
    core: [
        "index.css",
        "../share/logo.avif",
        "../share/theme.css",
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net/npm/vue@3.5.34/dist/vue.global.prod.js",
    ],
    leaflet: [
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css",
        "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.css",
        "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js",
        "https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js",
    ],
    phaser: "https://cdn.jsdelivr.net/npm/phaser@4.1.0/dist/phaser.min.js",
    math: "https://cdn.jsdelivr.net/npm/mathjs@15.2.0/lib/browser/math.js",
    peer: "https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js",
    qr: "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
    auth: "https://cdn.jsdelivr.net/npm/otpauth@9.5.1/dist/otpauth.umd.min.js",
    threeview: [
        "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js",
        "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js",
    ], // Do Not Update
    chess: "https://cdn.jsdelivr.net/npm/chess.js@0.12.1/chess.min.js", // Do Not Update
    three: "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js", // Do Not Update

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
            if (url.endsWith('.avif')) {
                document.write(`<link rel="icon" type="image/avif" href="${url}">`);
            } else if (url.endsWith('.css')) {
                document.write(`<link rel="stylesheet" href="${url}">`);
            } else if (url.endsWith('.js') || url.includes('cdn.tailwindcss.com')) {
                document.write(`<script src="${url}"></script>`);
            }
        });
    });
}
