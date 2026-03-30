const TILE_SIZE = 48;
const CHUNK_SIZE = 8;
const GRAVITY = 0.8;
const JUMP_POWER = -12;

class AveroWorld extends Phaser.Scene {
    constructor() {
        super('AveroWorld');
        this.chunks = new Map();
        this.worldChanges = new Map(); // Stores modified tiles: "gx,gy" -> height
        this.player = null;
        this.keys = null;
        this.playerVely = 0;
        this.isJumping = false;
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        // --- TEXTURE: Block ---
        g.fillStyle(0x1e1b4b, 1);
        g.fillRect(0, 10, TILE_SIZE, TILE_SIZE);
        g.lineStyle(2, 0x6366f1, 0.3);
        g.strokeRect(0, 10, TILE_SIZE, TILE_SIZE);
        const topFace = [{x: 0, y: 10}, {x: 10, y: 0}, {x: TILE_SIZE + 10, y: 0}, {x: TILE_SIZE, y: 10}];
        g.fillStyle(0x312e81, 1);
        g.fillPoints(topFace, true);
        g.strokePoints(topFace, true);
        g.generateTexture('block', TILE_SIZE + 10, TILE_SIZE + 10);

        // --- TEXTURE: Grass/Tree/Player ---
        g.clear().lineStyle(2, 0x22c55e, 1).moveTo(8, 16).lineTo(4, 0).moveTo(8, 16).lineTo(8, -4).moveTo(8, 16).lineTo(12, 0).generateTexture('grass', 16, 16);
        g.clear().fillStyle(0x713f12, 1).fillRect(12, 24, 8, 16).fillStyle(0x15803d, 1).fillCircle(16, 16, 16).lineStyle(2, 0x4ade80, 0.5).strokeCircle(16, 16, 16).generateTexture('tree', 32, 40);
        g.clear().fillStyle(0xffffff, 1).fillRect(0, 0, 20, 40).generateTexture('player', 20, 40);
    }

    create() {
        this.cam = this.cameras.main;
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,Q,E');
        this.player = this.add.container(0, 0);
        this.playerBody = this.add.image(0, 0, 'player').setOrigin(0.5, 1);
        this.player.add(this.playerBody);
        this.cam.startFollow(this.player, true, 0.1, 0.1);

        // Input Listeners for single-press actions
        this.input.keyboard.on('keydown-Q', () => this.mineBlock());
        this.input.keyboard.on('keydown-E', () => this.placeBlock());
    }

    update() {
        this.handleMovement();
        this.handleJump();
        this.updateChunks();
    }

    // --- INTERACTION LOGIC ---

    getCurrentTileCoords() {
        const gx = Math.round(this.player.x / TILE_SIZE);
        const gy = Math.round(this.player.y / TILE_SIZE);
        return { gx, gy };
    }

    mineBlock() {
        const { gx, gy } = this.getCurrentTileCoords();
        const key = `${gx},${gy}`;

        // Get current height (either modified or original)
        let currentHeight = this.worldChanges.has(key) ?
        this.worldChanges.get(key) :
        new Phaser.Math.RandomDataGenerator([gx, gy]).between(1, 3);

        if (currentHeight > 0) {
            this.worldChanges.set(key, currentHeight - 1);
            this.reloadChunkAt(gx, gy);
        }
    }

    placeBlock() {
        const { gx, gy } = this.getCurrentTileCoords();
        const key = `${gx},${gy}`;

        let currentHeight = this.worldChanges.has(key) ?
        this.worldChanges.get(key) :
        new Phaser.Math.RandomDataGenerator([gx, gy]).between(1, 3);

        if (currentHeight < 10) { // Limit height
            this.worldChanges.set(key, currentHeight + 1);
            this.reloadChunkAt(gx, gy);
        }
    }

    reloadChunkAt(gx, gy) {
        const cx = Math.floor(gx / CHUNK_SIZE);
        const cy = Math.floor(gy / CHUNK_SIZE);
        const chunkKey = `${cx},${cy}`;

        if (this.chunks.has(chunkKey)) {
            this.chunks.get(chunkKey).destroy(true);
            this.chunks.delete(chunkKey);
            this.generateChunk(cx, cy, chunkKey);
        }
    }

    // --- CORE ENGINE LOGIC ---

    handleMovement() {
        const speed = 5;
        let vx = 0, vy = 0;
        if (this.keys.W.isDown) vy -= 1;
        if (this.keys.S.isDown) vy += 1;
        if (this.keys.A.isDown) vx -= 1;
        if (this.keys.D.isDown) vx += 1;
        if (vx !== 0 || vy !== 0) {
            const mag = Math.sqrt(vx*vx + vy*vy);
            this.player.x += (vx / mag) * speed;
            this.player.y += (vy / mag) * speed;
        }
        this.player.setDepth(this.player.y + 200);
    }

    handleJump() {
        if (this.keys.SPACE.isDown && !this.isJumping) { this.playerVely = JUMP_POWER; this.isJumping = true; }
        if (this.isJumping) {
            this.playerVely += GRAVITY;
            this.playerBody.y += this.playerVely;
            if (this.playerBody.y >= 0) { this.playerBody.y = 0; this.isJumping = false; this.playerVely = 0; }
        }
    }

    updateChunks() {
        const pX = Math.floor(this.player.x / (TILE_SIZE * CHUNK_SIZE));
        const pY = Math.floor(this.player.y / (TILE_SIZE * CHUNK_SIZE));
        const radius = 2;
        let pending = [];

        for (let x = pX - radius; x <= pX + radius; x++) {
            for (let y = pY - radius; y <= pY + radius; y++) {
                const key = `${x},${y}`;
                if (!this.chunks.has(key)) {
                    pending.push({ x, y, key, dist: Phaser.Math.Distance.Between(x, y, pX, pY) });
                }
            }
        }
        pending.sort((a, b) => a.dist - b.dist);
        if (pending.length > 0) this.generateChunk(pending[0].x, pending[0].y, pending[0].key);

        for (const [key, group] of this.chunks) {
            const [cx, cy] = key.split(',').map(Number);
            if (Math.abs(cx - pX) > radius + 1 || Math.abs(cy - pY) > radius + 1) {
                group.destroy(true);
                this.chunks.delete(key);
            }
        }
    }

    generateChunk(cx, cy, key) {
        const group = this.add.group();
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                const gx = (cx * CHUNK_SIZE) + x;
                const gy = (cy * CHUNK_SIZE) + y;
                const sx = gx * TILE_SIZE;
                const sy = gy * TILE_SIZE;

                const rng = new Phaser.Math.RandomDataGenerator([gx, gy]);

                // Check if this tile was modified by the player
                const tileKey = `${gx},${gy}`;
                const height = this.worldChanges.has(tileKey) ?
                this.worldChanges.get(tileKey) : rng.between(1, 3);

                let lastY = sy;
                for(let h = 0; h < height; h++) {
                    lastY = sy - (h * 8);
                    const b = this.add.image(sx + (h * 2), lastY, 'block');
                    b.setTint(h === height - 1 ? 0x6366f1 : 0x0f172a);
                    b.setDepth(sy + h);
                    group.add(b);
                }

                // Only show decorations if the block wasn't mined to 0
                if (height > 0) {
                    const chance = rng.frac();
                    if (chance > 0.92) {
                        const tree = this.add.image(sx + (height * 2), lastY - 10, 'tree').setOrigin(0.5, 1).setDepth(sy + 150);
                        group.add(tree);
                    } else if (chance > 0.75) {
                        const grass = this.add.image(sx + (height * 2) + rng.between(-10, 10), lastY - 4, 'grass').setDepth(sy + 110);
                        group.add(grass);
                    }
                }
            }
        }
        this.chunks.set(key, group);
    }
}

const config = { type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, scene: AveroWorld, parent: document.body, backgroundColor: '#020205' };
new Phaser.Game(config);
