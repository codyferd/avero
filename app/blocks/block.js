const BLOCKS = {
    GRASS:  { id: 0, color: 0x2dcc70 },
    DIRT:   { id: 1, color: 0x6d4c41 },
    WATER:  { id: 2, color: 0x00aaff },
    WOOD:   { id: 3, color: 0x5d4037 },
    LEAF:   { id: 4, color: 0x2e7d32 },
    SAND:   { id: 5, color: 0xedc9af },
    STONE:  { id: 6, color: 0x7f8c8d },
    FLOWER: { id: 7, color: 0x104928 },
};

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

    // New: Check if a coordinate should be a cave air pocket
    isCave: (x, y, z) => {
        // Simple 3D math: creates "Swiss cheese" bubbles underground
        // Adjust the multipliers (0.1, 0.2) to change cave size/frequency
        const noise = Math.sin(x * 0.2) * Math.cos(y * 0.2) * Math.sin(z * 0.2);
        return y < (TERRAIN_BASE_HEIGHT - 2) && noise > 0.7;
    }
};

function placeBlock(i, x, y, z, blockType, instancedMesh) {
    _tempMatrix.setPosition(x, y, z);
    instancedMesh.setMatrixAt(i, _tempMatrix);
    _tempColor.setHex(blockType.color);
    instancedMesh.setColorAt(i, _tempColor);
    return i + 1;
}
