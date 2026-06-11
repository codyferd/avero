const STRUCTURES = {
    TREE: (gx, height, gz, randomVal) => {
        const trunkHeight = 3 + Math.floor(randomVal * 3);
        const parts = [];
        for (let ty = 0; ty < trunkHeight; ty++) {
            parts.push({ x: gx, y: height + ty, z: gz, type: BLOCKS.WOOD });
        }
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                for (let ly = 0; ly < 2; ly++) {
                    parts.push({ x: gx + lx, y: height + trunkHeight + ly, z: gz + lz, type: BLOCKS.LEAF });
                }
            }
        }
        return parts;
    },

    isCave: (x, y, z) => {
        const noise = Math.sin(x * 0.2) * Math.cos(y * 0.2) * Math.sin(z * 0.2);
        return y < (TERRAIN_BASE_HEIGHT - 2) && noise > 0.7;
    }
};

const chunks = new Map();
const _tempColor = new THREE.Color(), _tempMatrix = new THREE.Matrix4();

const getTerrainHeight = (x, z) => {
    const nx = x + WORLD_SEED, nz = z + WORLD_SEED;
    let h = (Math.sin(nx * TERRAIN_ROUGHNESS) * Math.cos(nz * TERRAIN_ROUGHNESS)) * TERRAIN_AMPLITUDE;
    h += (Math.sin(nx * 0.2) + Math.cos(nz * 0.2)) * 1.5;
    return Math.floor(h + TERRAIN_BASE_HEIGHT);
};

const pseudoRandom = (x, z) => (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1);

function generateChunk(cx, cz, scene, geometry, material) {
    const key = `${cx},${cz}`;
    if (chunks.has(key)) return;

    const max = CHUNK_SIZE * CHUNK_SIZE * (VISIBLE_LAYERS + 20);
    const mesh = new THREE.InstancedMesh(geometry, material, max);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);

    let i = 0;
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gx = cx * CHUNK_SIZE + x, gz = cz * CHUNK_SIZE + z;
            const h = getTerrainHeight(gx, gz);

            for (let y = h - 1; y >= h - VISIBLE_LAYERS; y--) {
                if (y < 0 || STRUCTURES.isCave(gx, y, gz)) continue;

                let type = BLOCKS.STONE;
                if (y === h - 1) type = (y <= WATER_LEVEL) ? BLOCKS.SAND : BLOCKS.GRASS;
                else if (y > h - 3) type = BLOCKS.DIRT;

                i = placeBlock(i, gx, y, gz, type, mesh);
            }

            if (h < WATER_LEVEL) {
                for (let y = h; y < WATER_LEVEL; y++) i = placeBlock(i, gx, y, gz, BLOCKS.WATER, mesh);
            }

            if (h >= WATER_LEVEL) {
                const rng = pseudoRandom(gx, gz);
                if (rng < TREE_CHANCE) {
                    STRUCTURES.TREE(gx, h, gz, rng).forEach(p => {
                        if (i < max) i = placeBlock(i, p.x, p.y, p.z, p.type, mesh);
                    });
                } else if (rng < FLOWER_CHANCE) {
                    i = placeBlock(i, gx, h, gz, BLOCKS.FLOWER, mesh);
                }
            }
        }
    }

    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    chunks.set(key, mesh);
}

function updateWorldChunks(camera, scene, geometry, material) {
    const pCX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pCZ = Math.floor(camera.position.z / CHUNK_SIZE);

    for (let x = pCX - RENDER_DISTANCE; x <= pCX + RENDER_DISTANCE; x++) {
        for (let z = pCZ - RENDER_DISTANCE; z <= pCZ + RENDER_DISTANCE; z++) generateChunk(x, z, scene, geometry, material);
    }

    chunks.forEach((mesh, key) => {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pCX) > RENDER_DISTANCE + 1 || Math.abs(cz - pCZ) > RENDER_DISTANCE + 1) {
            scene.remove(mesh);
            mesh.dispose();
            chunks.delete(key);
        }
    });
}
