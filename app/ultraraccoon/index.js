const menu = document.getElementById('game-menu');
const startBtn = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');

// This flag ensures the game logic doesn't run until true
let gameActive = false;

startBtn.addEventListener('click', () => {
    // 1. Visual Transition
    menu.classList.add('opacity-0', 'scale-150', 'pointer-events-none');
    gameContainer.classList.remove('opacity-0');

    // 2. Lock the state
    gameActive = true;

    // 3. Trigger the actual game start logic from your app.js
    // If your app.js has a function like init() or start(), call it here:
    if (typeof initGame === 'function') {
        initGame();
    } else if (typeof game !== 'undefined' && game.start) {
        game.start();
    }

    setTimeout(() => {
        menu.style.display = 'none';
    }, 500);
});

// Prevention: Stop event listeners or loops if gameActive is false
window.addEventListener('keydown', (e) => {
    if (!gameActive) {
        e.preventDefault(); // Stops scrolling/jumping before game starts
        return false;
    }
});

document.addEventListener('visibilitychange', () => {
    if (typeof game !== 'undefined' && gameActive) {
        if (document.hidden) game.loop.pause();
        else game.loop.resume();
    }
});

class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load your animated AVIFs
        const assets = [
            'idle', 'run', 'jump',
            'crouch', 'ko', 'victory'
        ];

        assets.forEach(asset => {
            this.load.image(asset, `media/${asset}.avif`);
        });

        // Simple loading text
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Loading Ultraraccoon...', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    create() {
        // Once assets are loaded, launch the first level
        this.scene.start('Level1');
    }
}

// Global game configuration
// Now that Boot and Level1 are defined above, this will no longer throw an error.
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 2000,
        height: 1000
    },
    physics: {
        default: 'arcade',
            arcade: {
                gravity: { y: CONFIG.GRAVITY },
                debug: false
            }
    },
    // Both classes are now safely initialized
    scene: [Boot, Level1]
};

// Initialize the game
const game = new Phaser.Game(config);

// Handle window resizing
window.addEventListener('resize', () => {
    game.scale.refresh();
});
