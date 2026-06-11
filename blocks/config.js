// --- WORLD DIMENSIONS ---
const BLOCK_SIZE = 1;
const CHUNK_SIZE = 32;     
const RENDER_DISTANCE = 4;  

// --- PHYSICS & MOVEMENT ---
const GRAVITY = -0.015;
const JUMP_FORCE = 0.25;
const SPEED = 0.2;          
const PLAYER_HEIGHT = 2.0;  

// --- TERRAIN GENERATION ---
const TERRAIN_BASE_HEIGHT = 10;  
const TERRAIN_AMPLITUDE = 8;     
const TERRAIN_ROUGHNESS = 0.05;  
const WORLD_SEED = Math.random() * 10000; 
const WATER_LEVEL = 4;
const TREE_CHANCE = 0.005;
const FLOWER_CHANCE = 0;

// --- VISUALS & COLORS ---
const SKY_COLOR = 0x87CEEB;
const FOG_NEAR = 100;
const FOG_FAR = 250;

const COLOR_GRASS_HEX = 0x2dcc70;
const COLOR_DIRT_HEX = 0x795548;

// --- PERFORMANCE ---
const VISIBLE_LAYERS = 2;
