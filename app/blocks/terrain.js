// --- WORLD STATE ---
const chunks = new Map();

// Helper to avoid memory allocation inside loops
const _tempColor = new THREE.Color();
const _tempMatrix = new THREE.Matrix4();

/**
 * Procedural Terrain Function
 */
function getTerrainHeight(x, z) {
    const nx = x + WORLD_SEED;
    const nz = z + WORLD_SEED;

    let h = 0;
    // Uses variables from config.js
    h += (Math.sin(nx * TERRAIN_ROUGHNESS) * Math.cos(nz * TERRAIN_ROUGHNESS)) * TERRAIN_AMPLITUDE;
    h += (Math.sin(nx * 0.2) + Math.cos(nz * 0.2)) * 1.5;

    return Math.floor(h + TERRAIN_BASE_HEIGHT);
}

/**
 * Generates and adds a chunk to the scene
 */
function generateChunk(cx, cz, scene, geometry, material) {
    const key = `${cx},${cz}`;
    if (chunks.has(key)) return;

    // surfaceCount: Blocks per pillar * width * depth
    const surfaceCount = CHUNK_SIZE * CHUNK_SIZE * VISIBLE_LAYERS;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, surfaceCount);

    // --- COLOR BUFFER INITIALIZATION ---
    // Manually create the attribute so setColorAt works
    const colorData = new Float32Array(surfaceCount * 3);
    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorData, 3);

    let i = 0;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gx = cx * CHUNK_SIZE + x;
            const gz = cz * CHUNK_SIZE + z;
            const height = getTerrainHeight(gx, gz);

            for (let y = height - 1; y >= height - VISIBLE_LAYERS; y--) {
                if (y < 0) continue;

                // Set position
                _tempMatrix.setPosition(gx, y, gz);
                instancedMesh.setMatrixAt(i, _tempMatrix);

                // --- THE COLOR FIX ---
                // .setHex() is used for numbers like 0x2dcc70
                // If you use .copy(), it expects a THREE.Color object
                if (y === height - 1) {
                    _tempColor.setHex(COLOR_GRASS_HEX);
                } else {
                    _tempColor.setHex(COLOR_DIRT_HEX);
                }

                instancedMesh.setColorAt(i, _tempColor);
                i++;
            }
        }
    }

    // Tell the mesh how many instances we actually filled
    instancedMesh.count = i;

    // Update GPU buffers
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;

    scene.add(instancedMesh);
    chunks.set(key, instancedMesh);
}

/**
 * Manages chunk loading/unloading
 */
function updateWorldChunks(camera, scene, geometry, material) {
    const pCX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pCZ = Math.floor(camera.position.z / CHUNK_SIZE);

    for (let x = pCX - RENDER_DISTANCE; x <= pCX + RENDER_DISTANCE; x++) {
        for (let z = pCZ - RENDER_DISTANCE; z <= pCZ + RENDER_DISTANCE; z++) {
            generateChunk(x, z, scene, geometry, material);
        }
    }

    for (const [key, mesh] of chunks) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pCX) > RENDER_DISTANCE + 1 || Math.abs(cz - pCZ) > RENDER_DISTANCE + 1) {
            scene.remove(mesh);
            mesh.dispose();
            chunks.delete(key);
        }
    }
}
