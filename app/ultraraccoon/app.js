/**
 * Boot Scene: Handles asset loading for the animated AVIF files
 * Moved to the top so it is initialized before the config refers to it.
 */
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
