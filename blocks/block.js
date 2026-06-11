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

function placeBlock(i, x, y, z, blockType, instancedMesh) {
    _tempMatrix.setPosition(x, y, z);
    instancedMesh.setMatrixAt(i, _tempMatrix);
    _tempColor.setHex(blockType.color);
    instancedMesh.setColorAt(i, _tempColor);
    return i + 1;
}
