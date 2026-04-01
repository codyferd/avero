// --- GLOBAL ENGINE VARIABLES ---
let scene, camera, renderer;
let blockGeometry, blockMaterial;

/**
 * INITIALIZE THE ENGINE
 */
function initEngine() {
    // 1. Create Scene & Sky
    scene = new THREE.Scene();
    // Using .setHex with SRGBColorSpace ensures the sky matches your hex exactly
    scene.background = new THREE.Color().setHex(SKY_COLOR, THREE.SRGBColorSpace);
    scene.fog = new THREE.Fog(scene.background, FOG_NEAR, FOG_FAR);

    // 2. Setup Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(50, 25, 50);

    // 3. Setup Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false, // Performance boost for voxel games
        powerPreference: "high-performance"
    });

    // Modern Color Standards
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.colorManagement = true;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 4. LIGHTING - Optimized for Voxel Definition

    // A. Hemisphere Light: Simulates light from the sky (top) and bounce from the ground (bottom)
    // This prevents the "underside" of blocks from being pure black without washing out the sides.
    const skyColor = 0xffffff; // White sky light
    const groundColor = 0x444444; // Dark grey ground bounce
    const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
    scene.add(hemiLight);

    // B. Directional Light (The Sun):
    // Position it at an angle (e.g., 45 degrees) so it hits three faces of a cube
    // with different intensities. This is what creates the 3D effect.
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(10, 20, 10); // Closer, angled position for better shading logic
    scene.add(sun);

    // C. (Optional) Subtle "Fill" Light:
    // If one side of your hills is too dark, add a very weak light from the opposite side.
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // 5. Shared Assets
    blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Lambert is great for performance, vertexColors is the bridge for InstancedMesh
    blockMaterial = new THREE.MeshLambertMaterial({
        vertexColors: true
    });

    // 6. Init Player Inputs
    initPlayerInputs();

    // 7. Handle Window Resizing
    window.addEventListener('resize', onWindowResize);
}

/**
 * THE MAIN GAME LOOP
 */
function animate() {
    requestAnimationFrame(animate);

    // Update Logic
    updatePlayer(camera);
    updateWorldChunks(camera, scene, blockGeometry, blockMaterial);

    // Render
    renderer.render(scene, camera);
}

/**
 * UTILS
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// START THE GAME
window.addEventListener('DOMContentLoaded', () => {
    initEngine();
    animate();
});

