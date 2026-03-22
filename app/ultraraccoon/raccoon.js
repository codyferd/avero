/**
 * Avero OS: UltraRaccoon Component
 * Combined Config & Class
 * Physics: High-Arc Bouncy Jump + Slippery Ground
 */
const CONFIG = {
    GRAVITY: 750,            // Lower gravity = Higher, floatier jump
    RACCOON_SPEED: 400,       // Max horizontal slide speed
    RACCOON_JUMP: -750,      // Powerful upward thrust
    ACCELERATION: 1000,       // Acceleration speed
    DRAG: 300,                // Very low drag for maximum slipperiness
    TERMINAL_VELOCITY: 1000,  // Safety cap for falling
    ANIM_SPEED: 150           // Speed (ms) to toggle "loop" frames if using spritesheets
};

class Raccoon extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(100, 100);
        this.body.setSize(this.width * 0.8, this.height);

        // Physics Initialization
        this.body.setCollideWorldBounds(true);
        this.scene.physics.world.setBoundsCollision(true, true, true, false);

        this.body.setGravityY(CONFIG.GRAVITY);
        this.body.setMaxVelocity(CONFIG.RACCOON_SPEED, CONFIG.TERMINAL_VELOCITY);
        this.setDragX(CONFIG.DRAG);

        this.currentState = 'idle';
        this.isDead = false;

        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            die: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.setAnimation('idle');
    }

    /**
     * Texture Scrubber: Handles transparency and color bumping.
     * Note: If 'key' is an animated AVIF, Phaser usually only sees frame 0.
     */
    scrubTexture(key) {
        const cleanKey = key + '_clean';
        if (this.scene.textures.exists(cleanKey)) return cleanKey;

        const texture = this.scene.textures.get(key);
        const source = texture.getSourceImage();

        if (!source || !source.width) return key;

        const canvas = this.scene.textures.createCanvas(cleanKey, source.width, source.height);
        const ctx = canvas.getContext();

        ctx.drawImage(source, 0, 0);
        const imgData = ctx.getImageData(0, 0, source.width, source.height);
        const pixels = imgData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] === 0 && pixels[i+1] === 0 && pixels[i+2] === 0) {
                pixels[i+3] = 0;
            } else if (pixels[i] < 2 && pixels[i+1] < 2 && pixels[i+2] < 2) {
                pixels[i] = 1; pixels[i+1] = 1; pixels[i+2] = 1;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        canvas.refresh();
        return cleanKey;
    }

    /**
     * setAnimation
     * Sets texture and resets size to maintain Avero UI scale.
     */
    setAnimation(key) {
        if (!this.scene.textures.exists(key)) return;

        if (this.currentState !== key) {
            const cleanKey = this.scrubTexture(key);
            this.setTexture(cleanKey);
            this.currentState = key;
            this.setDisplaySize(100, 100);
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        this.setAnimation('ko');
        this.setAcceleration(0, 0);
        this.setVelocity(0, CONFIG.RACCOON_JUMP * 0.5);

        if (this.body) {
            this.body.checkCollision.none = true;
        }

        this.scene.time.delayedCall(1500, () => {
            this.scene.scene.restart();
        });
    }

    update() {
        if (this.isDead) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.die)) {
            this.die();
            return;
        }

        const isOnGround = this.body.blocked.down || this.body.touching.down;
        const velocityX = Math.abs(this.body.velocity.x);

        // --- MOVEMENT ---
        if (this.keys.left.isDown) {
            this.setAccelerationX(-CONFIG.ACCELERATION);
            this.setFlipX(true);
        } else if (this.keys.right.isDown) {
            this.setAccelerationX(CONFIG.ACCELERATION);
            this.setFlipX(false);
        } else {
            this.setAccelerationX(0);
            // Low DRAG makes him slide here
        }

        // --- JUMP ---
        if (Phaser.Input.Keyboard.JustDown(this.keys.up) && isOnGround) {
            this.setVelocityY(CONFIG.RACCOON_JUMP);
        }

        // --- CROUCH / BRAKE ---
        if (this.keys.down.isDown && isOnGround) {
            this.setDragX(CONFIG.DRAG * 10); // "Dig in" to stop the slide
        } else {
            this.setDragX(CONFIG.DRAG);
        }

        // --- ANIMATION STATE MACHINE ---
        if (!isOnGround) {
            this.setAnimation('jump');
        } else if (velocityX > 30) {
            this.setAnimation('run');
        } else if (this.keys.down.isDown) {
            this.setAnimation('crouch');
        } else {
            this.setAnimation('idle');
        }
    }
}

