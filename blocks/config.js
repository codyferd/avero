// --- WORLD DIMENSIONS ---
const BLOCK_SIZE = 1;
const CHUNK_SIZE = 32;     // 100x100 blocks per chunk
const RENDER_DISTANCE = 4;  // Number of chunks to load around the player

// --- PHYSICS & MOVEMENT ---
const GRAVITY = -0.015;
const JUMP_FORCE = 0.25;
const SPEED = 0.2;          // Walking speed
const PLAYER_HEIGHT = 2.0;  // Eye level height above the ground

// --- TERRAIN GENERATION ---
const TERRAIN_BASE_HEIGHT = 10;  // The "sea level" or flat ground height
const TERRAIN_AMPLITUDE = 8;     // How high the hills go
const TERRAIN_ROUGHNESS = 0.05;  // Higher = more frequent hills
const WORLD_SEED = Math.random() * 10000; // Random seed for every session
const WATER_LEVEL = 4;
const TREE_CHANCE = 0.005;
const FLOWER_CHANCE = 0;


// --- VISUALS & COLORS ---
const SKY_COLOR = 0x87CEEB;
const FOG_NEAR = 100;
const FOG_FAR = 250;

// Vibrant Minecraft-style palette
// Change from new THREE.Color(...) to simple hex numbers
const COLOR_GRASS_HEX = 0x2dcc70;
const COLOR_DIRT_HEX = 0x795548;


// --- PERFORMANCE ---
// Only render the top X layers to save GPU memory
// Setting this to 2 means we render the grass and one layer of dirt beneath it
const VISIBLE_LAYERS = 2;
