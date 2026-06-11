window.addEventListener('DOMContentLoaded', () => {
    if (typeof initBlockPicker === 'function') {
        initBlockPicker();
    }
});

// --- GLOBAL ENGINE VARIABLES ---
let scene, camera, renderer;
let blockGeometry, blockMaterial;
let lastTime = performance.now();
let frames = 0;
const fpsDisplay = document.getElementById('fps-counter');

// Touch View Tracking States
let touchLookId = null;
let lastTouchX = 0;
let lastTouchY = 0;
const touchSensitivity = 0.005;

// Global inputs structural proxy hook
window.mobileControlsState = {
    moveForward: 0,
    moveBackward: 0,
    moveLeft: 0,
    moveRight: 0,
    jump: false,
    actionBreak: false,
    actionPlace: false
};

/**
 * INITIALIZE THE ENGINE
 */
function initEngine() {
    // 1. Create Scene & Sky
    scene = new THREE.Scene();
    scene.background = new THREE.Color().setHex(SKY_COLOR, THREE.SRGBColorSpace);
    scene.fog = new THREE.Fog(scene.background, FOG_NEAR, FOG_FAR);

    // 2. Setup Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(50, 25, 50);

    // 3. Setup Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false, 
        powerPreference: "high-performance"
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.colorManagement = true;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 4. LIGHTING - Optimized for Voxel Definition
    const skyColor = 0xffffff; 
    const groundColor = 0x444444; 
    const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(10, 20, 10); 
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // 5. Shared Assets
    blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    blockMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: false,
        opacity: 1.0
    });

    // 6. Init Player Inputs & Dynamic Touch Mechanics
    initPlayerInputs();
    setupMobileInteraction();

    // 7. Handle Window Resizing
    window.addEventListener('resize', onWindowResize);
}

/**
 * MOBILE INTERACTION SYSTEMS LOGIC
 */
function setupMobileInteraction() {
    // Auto flag device mode configurations on runtime contact
    window.addEventListener('touchstart', function onFirstTouch() {
        document.getElementById('mobile-overlay').style.display = 'block';
        window.removeEventListener('touchstart', onFirstTouch);
    });

    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');
    let joystickTouchId = null;
    let baseCenter = { x: 0, y: 0 };
    const maxRadius = 45;

    // Joystick Math Calculations
    joystickBase.addEventListener('touchstart', (e) => {
        if (joystickTouchId !== null) return;
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        
        const rect = joystickBase.getBoundingClientRect();
        baseCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (joystickTouchId === null) return;
        
        let touch = null;
        for (let t of e.touches) {
            if (t.identifier === joystickTouchId) {
                touch = t;
                break;
            }
        }
        if (!touch) return;

        const deltaX = touch.clientX - baseCenter.x;
        const deltaY = touch.clientY - baseCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let angle = Math.atan2(deltaY, deltaX);
        let moveRadius = Math.min(distance, maxRadius);

        let tx = Math.cos(angle) * moveRadius;
        let ty = Math.sin(angle) * moveRadius;

        joystickThumb.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;

        let normX = tx / maxRadius;
        let normY = ty / maxRadius;

        window.mobileControlsState.moveForward = normY < 0 ? -normY : 0;
        window.mobileControlsState.moveBackward = normY > 0 ? normY : 0;
        window.mobileControlsState.moveLeft = normX < 0 ? -normX : 0;
        window.mobileControlsState.moveRight = normX > 0 ? normX : 0;
    }, { passive: false });

    const resetJoystick = (e) => {
        if (joystickTouchId === null) return;
        for (let t of e.changedTouches) {
            if (t.identifier === joystickTouchId) {
                joystickTouchId = null;
                joystickThumb.style.transform = 'translate(-50%, -50%)';
                window.mobileControlsState.moveForward = 0;
                window.mobileControlsState.moveBackward = 0;
                window.mobileControlsState.moveLeft = 0;
                window.mobileControlsState.moveRight = 0;
                break;
            }
        }
    };

    window.addEventListener('touchend', resetJoystick);
    window.addEventListener('touchcancel', resetJoystick);

    // Touch look setup (Swipe tracking everywhere outside UI elements)
    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.closest('#action-zone') || e.target.closest('#hotbar')) return;
        if (touchLookId !== null) return;

        const touch = e.changedTouches[0];
        touchLookId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (touchLookId === null) return;

        let touch = null;
        for (let t of e.touches) {
            if (t.identifier === touchLookId) {
                touch = t;
                break;
            }
        }
        if (!touch) return;

        const movementX = touch.clientX - lastTouchX;
        const movementY = touch.clientY - lastTouchY;

        camera.rotation.y -= movementX * touchSensitivity;
        camera.rotation.x -= movementY * touchSensitivity;
        camera.rotation.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, camera.rotation.x));

        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    });

    const resetTouchLook = (e) => {
        if (touchLookId === null) return;
        for (let t of e.changedTouches) {
            if (t.identifier === touchLookId) {
                touchLookId = null;
                break;
            }
        }
    };
    window.addEventListener('touchend', resetTouchLook);
    window.addEventListener('touchcancel', resetTouchLook);

    // Action button bindings
    const btnBreak = document.getElementById('btn-break');
    const btnPlace = document.getElementById('btn-place');
    const btnJump = document.getElementById('btn-jump');

    btnBreak.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.actionBreak = true; });
    btnPlace.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.actionPlace = true; });
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.jump = true; });
    btnJump.addEventListener('touchend', () => { window.mobileControlsState.jump = false; });
    btnJump.addEventListener('touchcancel', () => { window.mobileControlsState.jump = false; });
}

/**
 * THE MAIN GAME LOOP
 */
function animate() {
    requestAnimationFrame(animate);

    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        fpsDisplay.innerText = `FPS: ${frames}`;
        frames = 0;
        lastTime = currentTime;
    }
    
    // Update Logic
    updatePlayer(camera);
    updateWorldChunks(camera, scene, blockGeometry, blockMaterial);

    // Reset single-pulse flags immediately after the update tick evaluation
    window.mobileControlsState.actionBreak = false;
    window.mobileControlsState.actionPlace = false;

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
