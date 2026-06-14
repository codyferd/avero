// --- WORLD DIMENSIONS ---
const BLOCK_SIZE = 1;
const CHUNK_SIZE = 16;       
let RENDER_DISTANCE = 5; // Changed to 'let' so the index.js HUD slider can dynamically override it

// --- PHYSICS & MOVEMENT ---
const GRAVITY = -0.015;      
const JUMP_FORCE = 0.24;    
const SPEED = 0.18;          
const PLAYER_HEIGHT = 1.8;   

// --- TERRAIN GENERATION PARAMETERS ---
const TERRAIN_BASE_HEIGHT = 8;  
const TERRAIN_AMPLITUDE = 14;     
const WORLD_SEED = Math.random() * 10000; 
const WATER_LEVEL = 5;
const TREE_CHANCE = 0.008;

// --- VISUALS & COLORS ---
const SKY_COLOR = 0x87CEEB;
const FOG_NEAR = 40;
const FOG_FAR = 90;

const BLOCKS = {
    GRASS:         { id: 0,  color: 0x2dcc70 },
    DIRT:          { id: 1,  color: 0x6d4c41 },
    WATER:         { id: 2,  color: 0x2980b9 },
    WOOD:          { id: 3,  color: 0x5d4037 },
    LEAF:          { id: 4,  color: 0x27ae60 },
    SAND:          { id: 5,  color: 0xf1c40f },
    STONE:         { id: 6,  color: 0x7f8c8d },
    SNOW:          { id: 8,  color: 0xffffff },
    MAGMA:         { id: 10, color: 0xe67e22 }, // Volcanic
    OBSIDIAN:      { id: 11, color: 0x1c2833 }, // Dark Obsidian Chasm base
    ICE:           { id: 12, color: 0xade8f4 }, // Shimmering glacial ice
    MUSHROOM:      { id: 13, color: 0x9b59b6 }, // Swampland structures
    MUD:           { id: 14, color: 0x4a3728 }, // Swamp / Redwood base
    CRYSTAL_BARK:  { id: 15, color: 0x1abc9c }, // Mystic Forest trunk
    CRYSTAL_LEAF:  { id: 16, color: 0xecf0f1 }, // Mystic Forest leaves
    RED_SAND:      { id: 17, color: 0xd35400 }, // Badlands top layer
    TERRACOTTA:    { id: 18, color: 0xba4a00 }, // Badlands sub-strata
    CORAL:         { id: 19, color: 0xe84393 }, // Vibrant Coral Reef structures
    CUSTOM:        { id: 9,  color: 0x6366F1 }  // Connected to HTML Color Picker
};

let selectedBlock = BLOCKS.CUSTOM;

// Pure deterministic matrix deployment pipeline for InstancedMesh clusters
function placeBlock(i, x, y, z, blockType, instancedMesh) {
    _tempMatrix.setPosition(x, y, z);
    instancedMesh.setMatrixAt(i, _tempMatrix);
    _tempColor.setHex(blockType.color);
    instancedMesh.setColorAt(i, _tempColor);
    return i + 1;
}
