// Optimized structure vectors to eliminate array pushing and memory allocations during run-time
const STRUCTURES = {
    TREE: (gx, height, gz, randomVal, mesh, index, maxInstances) => {
        let i = index;
        const trunkHeight = 4 + Math.floor(randomVal * 3);
        
        // Build trunk
        for (let ty = 0; ty < trunkHeight; ty++) {
            if (i >= maxInstances) break;
            i = placeBlock(i, gx, height + ty, gz, BLOCKS.WOOD, mesh);
        }
        // Build leaves leaves
        const leafY = height + trunkHeight - 1;
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && randomVal > 0.5) continue;
                if (i >= maxInstances) break;
                i = placeBlock(i, gx + lx, leafY, gz + lz, BLOCKS.LEAF, mesh);
            }
        }
        if (i < maxInstances) i = placeBlock(i, gx, height + trunkHeight, gz, BLOCKS.LEAF, mesh);
        return i;
    },
    CRYSTAL_SPIRE: (gx, height, gz, randomVal, mesh, index, maxInstances) => {
        let i = index;
        const trunkHeight = 5 + Math.floor(randomVal * 4);
        
        for (let ty = 0; ty < trunkHeight; ty++) {
            if (i >= maxInstances) break;
            i = placeBlock(i, gx, height + ty, gz, BLOCKS.CRYSTAL_BARK, mesh);
        }
        const topY = height + trunkHeight;
        if (i < maxInstances) i = placeBlock(i, gx, topY, gz, BLOCKS.CRYSTAL_LEAF, mesh);
        if (i < maxInstances) i = placeBlock(i, gx + 1, topY - 1, gz, BLOCKS.CRYSTAL_LEAF, mesh);
        if (i < maxInstances) i = placeBlock(i, gx - 1, topY - 1, gz, BLOCKS.CRYSTAL_LEAF, mesh);
        if (i < maxInstances) i = placeBlock(i, gx, topY - 1, gz + 1, BLOCKS.CRYSTAL_LEAF, mesh);
        if (i < maxInstances) i = placeBlock(i, gx, topY - 1, gz - 1, BLOCKS.CRYSTAL_LEAF, mesh);
        return i;
    }
};

const chunks = new Map();
const _tempColor = new THREE.Color(), _tempMatrix = new THREE.Matrix4();
const pseudoRandom = (x, z) => (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1);

// Static allocation optimization pooling to completely prevent run-time allocation thrashing
const _biomeDataResult = { id: 0, weightPrimary: 1.0 };

// Mapping biomes to fast integer ID allocations
const BIOME_IDS = {
    TUNDRA: 0, FROZEN_PEAKS: 1, ICE: 2, DESERT: 3, PLAINS: 4, MYSTIC_FOREST: 5,
    SWAMP: 6, BADLANDS: 7, SHATTERED_SAVANNA: 8, JUNGLE: 9, REDWOOD: 10,
    VOLCANIC: 11, OBSIDIAN_CHASM: 12, SPIKED_CANOS: 13, MOUNTAIN: 14, OCEAN: 15, CORAL_REEF: 16
};
const BIOME_NAMES = Object.keys(BIOME_IDS);

const getBiomeAt = (x, z) => {
    const nx = (x + WORLD_SEED) * 0.006;
    const nz = (z - WORLD_SEED) * 0.006;

    const sinNx = Math.sin(nx);
    const cosNz = Math.cos(nz);

    const temperature = (sinNx * cosNz + Math.sin(nx * 0.5) + 1.0) * 0.5;
    const moisture = (Math.cos(nx * 0.8) * Math.sin(nz * 0.8) + Math.cos(nz * 0.3) + 1.0) * 0.5;

    let bId = BIOME_IDS.PLAINS;
    _biomeDataResult.weightPrimary = 1.0;

    if (temperature < 0.25) {
        if (moisture < 0.3) bId = BIOME_IDS.TUNDRA;
        else if (moisture < 0.7) bId = BIOME_IDS.FROZEN_PEAKS;
        else bId = BIOME_IDS.ICE;
    } else if (temperature < 0.55) {
        if (moisture < 0.25) bId = BIOME_IDS.DESERT;
        else if (moisture < 0.5) bId = BIOME_IDS.PLAINS;
        else if (moisture < 0.75) bId = BIOME_IDS.MYSTIC_FOREST;
        else bId = BIOME_IDS.SWAMP;
    } else if (temperature < 0.8) {
        if (moisture < 0.2) bId = BIOME_IDS.BADLANDS;
        else if (moisture < 0.5) bId = BIOME_IDS.SHATTERED_SAVANNA;
        else if (moisture < 0.8) bId = BIOME_IDS.JUNGLE;
        else bId = BIOME_IDS.REDWOOD;
    } else {
        if (moisture < 0.3) bId = BIOME_IDS.VOLCANIC;
        else if (moisture < 0.5) bId = BIOME_IDS.OBSIDIAN_CHASM;
        else if (moisture < 0.75) bId = BIOME_IDS.SPIKED_CANOS;
        else bId = BIOME_IDS.MOUNTAIN;
    }

    const oceanNoise = (Math.sin(nx * 2.5) * Math.cos(nz * 2.5) + 1.0) * 0.5;
    if (oceanNoise < 0.18) {
        bId = BIOME_IDS.OCEAN;
    } else if (oceanNoise < 0.24) {
        bId = BIOME_IDS.CORAL_REEF;
        _biomeDataResult.weightPrimary = (oceanNoise - 0.18) / 0.06;
    }

    _biomeDataResult.id = bId;
    return _biomeDataResult;
};

const getBiomeRawHeight = (biomeId, x, z, combinedNoise) => {
    switch (biomeId) {
        case 15: return combinedNoise * 5 - 7;          // OCEAN
        case 16: return combinedNoise * 3 - 3;          // CORAL_REEF
        case 3:  return (Math.sin(x * 0.04) * Math.cos(z * 0.04)) * 3.5 + (Math.sin(x * 0.15) * 0.5); // DESERT
        case 7:  return Math.floor(combinedNoise * 6) + 4; // BADLANDS
        case 6:  return (Math.sin(x * 0.05) + Math.cos(z * 0.05)) * 1.5 - 1; // SWAMP
        case 0:  return combinedNoise * 4 + 1;          // TUNDRA
        case 5:  return combinedNoise * 5 + 3;          // MYSTIC_FOREST
        case 11: return Math.abs(combinedNoise * 8) + 2; // VOLCANIC
        case 14: return Math.abs(combinedNoise) * (TERRAIN_AMPLITUDE * 2.2) + 4; // MOUNTAIN
        case 1:  return Math.pow(Math.abs(combinedNoise * 2.5), 1.5) * TERRAIN_AMPLITUDE + 8; // FROZEN_PEAKS
        case 13: return (Math.tan(Math.sin(x * 0.06) * Math.cos(z * 0.06)) * 8) + 3; // SPIKED_CANOS
        case 8:                                         // SHATTERED_SAVANNA
            const plateauRaw = combinedNoise * 12 + 6;
            return plateauRaw > 8 ? 14 + (combinedNoise * 2) : plateauRaw;
        case 9:  return combinedNoise * 7 + 5;          // JUNGLE
        case 10: return combinedNoise * 4 + 6;          // REDWOOD
        case 12: return -Math.abs(combinedNoise * 10) - 2; // OBSIDIAN_CHASM
        case 4:                                         // PLAINS
        default: return combinedNoise * 4.5 + 1;
    }
};

const getTerrainHeight = (x, z) => {
    const sample = getBiomeAt(x, z);
    const primaryId = sample.id;
    const weightPrimary = sample.weightPrimary;
    
    const f1 = 0.08, f2 = 0.22, f3 = 0.45;
    const combinedNoise = (Math.sin(x * f1) * Math.cos(z * f1)) + 
                          (Math.cos(x * f2) * Math.sin(z * f2) * 0.4) + 
                          (Math.sin(x * f3) * Math.sin(z * f3) * 0.15);

    const baseHeight = getBiomeRawHeight(primaryId, x, z, combinedNoise);
    let finalHeightOffset = baseHeight;

    if (weightPrimary < 1.0) {
        const fallbackHeight = getBiomeRawHeight(15, x, z, combinedNoise); // OCEAN ID lookup
        finalHeightOffset = fallbackHeight + (baseHeight - fallbackHeight) * weightPrimary;
    } else {
        const sampleEdge = getBiomeAt(x + 4, z + 4);
        if (sampleEdge.id !== primaryId) {
            const neighborHeight = getBiomeRawHeight(sampleEdge.id, x, z, combinedNoise);
            finalHeightOffset = baseHeight + (neighborHeight - baseHeight) * 0.5;
        }
    }

    return { height: Math.floor(TERRAIN_BASE_HEIGHT + finalHeightOffset), biomeId: primaryId };
};

function generateChunk(cx, cz, scene, geometry, material) {
    const key = `${cx},${cz}`;
    if (chunks.has(key)) return;

    const maxInstances = CHUNK_SIZE * CHUNK_SIZE * 48;
    const mesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxInstances * 3), 3);

    let i = 0;
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const gx = cx * CHUNK_SIZE + x;
            const gz = cz * CHUNK_SIZE + z;
            
            const info = getTerrainHeight(gx, gz);
            const h = info.height;
            const bId = info.biomeId;

            // Render base layer columns
            for (let y = h - 1; y >= Math.max(0, h - 5); y--) {
                let type = BLOCKS.STONE;

                switch(bId) {
                    case 15: // OCEAN
                        type = (y === h - 1) ? BLOCKS.SAND : BLOCKS.DIRT;
                        break;
                    case 16: // CORAL_REEF
                        type = (y === h - 1) ? BLOCKS.CORAL : BLOCKS.SAND;
                        break;
                    case 3:  // DESERT
                        type = BLOCKS.SAND;
                        break;
                    case 7:  // BADLANDS
                        type = (y === h - 1) ? BLOCKS.RED_SAND : BLOCKS.TERRACOTTA;
                        break;
                    case 6:  // SWAMP
                        type = (y === h - 1) ? BLOCKS.MUD : BLOCKS.DIRT;
                        break;
                    case 0:  // TUNDRA
                        type = (y === h - 1) ? BLOCKS.SNOW : BLOCKS.ICE;
                        break;
                    case 5:  // MYSTIC_FOREST
                        type = (y === h - 1) ? BLOCKS.CUSTOM : BLOCKS.STONE;
                        break;
                    case 11: // VOLCANIC
                        type = (y === h - 1) ? BLOCKS.MAGMA : BLOCKS.OBSIDIAN;
                        break;
                    case 14: // MOUNTAIN
                    case 1:  // FROZEN_PEAKS
                        type = (y === h - 1 && h > 18) ? BLOCKS.SNOW : BLOCKS.STONE;
                        break;
                    case 13: // SPIKED_CANOS
                        type = BLOCKS.STONE;
                        break;
                    case 8:  // SHATTERED_SAVANNA
                    case 9:  // JUNGLE
                        type = (y === h - 1) ? BLOCKS.GRASS : BLOCKS.DIRT;
                        break;
                    case 10: // REDWOOD
                        type = (y === h - 1) ? BLOCKS.MUD : BLOCKS.DIRT;
                        break;
                    case 12: // OBSIDIAN_CHASM
                        type = BLOCKS.OBSIDIAN;
                        break;
                    case 4:  // PLAINS
                    default:
                        type = (y === h - 1) ? ((y <= WATER_LEVEL) ? BLOCKS.SAND : BLOCKS.GRASS) : BLOCKS.DIRT;
                        break;
                }

                if (i < maxInstances) i = placeBlock(i, gx, y, gz, type, mesh);
            }

            // Fill water volumes
            if (h < WATER_LEVEL) {
                for (let y = h; y < WATER_LEVEL; y++) {
                    if (i < maxInstances) i = placeBlock(i, gx, y, gz, BLOCKS.WATER, mesh);
                }
            }

            // Fast asset structure generation using inline pointer offsets
            const rng = pseudoRandom(gx, gz);
            if (h >= WATER_LEVEL && rng < TREE_CHANCE) {
                if (bId === 4 || bId === 8) { // PLAINS or SHATTERED_SAVANNA
                    i = STRUCTURES.TREE(gx, h, gz, rng, mesh, i, maxInstances);
                } else if (bId === 5) { // MYSTIC_FOREST
                    i = STRUCTURES.CRYSTAL_SPIRE(gx, h, gz, rng, mesh, i, maxInstances);
                } else if (bId === 9 || bId === 10) { // JUNGLE or REDWOOD
                    i = STRUCTURES.TREE(gx, h, gz, rng, mesh, i, maxInstances);
                } else if (bId === 6) { // SWAMP
                    if (i < maxInstances) i = placeBlock(i, gx, h, gz, BLOCKS.MUSHROOM, mesh);
                }
            }
        }
    }

    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    chunks.set(key, mesh);
}

function updateWorldChunks(camera, scene, geometry, material) {
    const pCX = Math.floor(camera.position.x / CHUNK_SIZE);
    const pCZ = Math.floor(camera.position.z / CHUNK_SIZE);

    for (let x = pCX - RENDER_DISTANCE; x <= pCX + RENDER_DISTANCE; x++) {
        for (let z = pCZ - RENDER_DISTANCE; z <= pCZ + RENDER_DISTANCE; z++) {
            generateChunk(x, z, scene, geometry, material);
        }
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

// Keep exposure safe for direct lookup injection hooks inside player scripts
window.getTerrainHeight = (x, z) => {
    const res = getTerrainHeight(x, z);
    return { height: res.height, biome: BIOME_NAMES[res.biomeId] };
};
