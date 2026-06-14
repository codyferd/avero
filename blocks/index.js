let scene, camera, renderer;
let blockGeometry, blockMaterial;

let lastTime = performance.now();
let fpsLastTime = performance.now();
let frames = 0;
const fpsDisplay = document.getElementById('fps-counter');
const coordsDisplay = document.getElementById('coords-display'); // Cached lookup target element

let touchLookId = null;
let lastTouchX = 0;
let lastTouchY = 0;
const touchSensitivity = 0.004;

window.mobileControlsState = {
    moveForward: 0,
    moveBackward: 0,
    moveLeft: 0,
    moveRight: 0,
    jump: false,
    actionBreak: false,
    actionPlace: false
};

function initEngine() {
    scene = new THREE.Scene();
    
    scene.background = new THREE.Color().setHex(SKY_COLOR, THREE.SRGBColorSpace);
    
    // Fallback initialize fog bound mappings to global configuration limits
    scene.fog = new THREE.Fog(scene.background, FOG_NEAR, FOG_FAR);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.rotation.order = 'YXZ';
    camera.position.set(16, 25, 16); 

    renderer = new THREE.WebGLRenderer({
        antialias: false, 
        powerPreference: "high-performance"
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.colorManagement = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(30, 80, 40); 
    scene.add(sun);

    blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    blockMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

    initPlayerInputs();
    setupMobileInteraction();
    setupHexColorPickerInterface();
    setupRenderDistanceInterface(); 

    window.addEventListener('resize', onWindowResize);
}

function setupRenderDistanceInterface() {
    const slider = document.getElementById('render-dist-slider');
    const label = document.getElementById('dist-lbl');
    
    if (slider) {
        slider.value = RENDER_DISTANCE;
        
        const updateRenderDistance = (value) => {
            const valInt = parseInt(value, 10);
            RENDER_DISTANCE = valInt;
            label.innerText = `${valInt} Chunks`;
            
            const maxViewRadius = valInt * CHUNK_SIZE * BLOCK_SIZE;
            if (scene && scene.fog) {
                scene.fog.near = maxViewRadius * 0.4;
                scene.fog.far = maxViewRadius * 0.95;
            }
        };

        slider.addEventListener('input', (e) => updateRenderDistance(e.target.value));
        updateRenderDistance(slider.value);
    }
}

function setupHexColorPickerInterface() {
    const picker = document.getElementById('block-color-picker');
    const label = document.getElementById('hex-lbl');
    
    if (picker) {
        const updateHexBlock = (hexValue) => {
            const cleanHex = hexValue.toUpperCase();
            label.innerText = cleanHex;
            BLOCKS.CUSTOM.color = parseInt(cleanHex.replace('#', '0x'), 16);
        };

        picker.addEventListener('input', (e) => updateHexBlock(e.target.value));
        updateHexBlock(picker.value);
    }
}

function setupMobileInteraction() {
    window.addEventListener('touchstart', function onFirstTouch() {
        document.getElementById('mobile-overlay').style.display = 'block';
        window.removeEventListener('touchstart', onFirstTouch);
    });

    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');
    let joystickTouchId = null;
    let baseCenter = { x: 0, y: 0 };
    const maxRadius = 45;

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

    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#joystick-zone') || e.target.closest('#action-zone') || e.target.closest('#hud')) return;
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

    const btnBreak = document.getElementById('btn-break');
    const btnPlace = document.getElementById('btn-place');
    const btnJump = document.getElementById('btn-jump');

    btnBreak.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.actionBreak = true; });
    btnPlace.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.actionPlace = true; });
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); window.mobileControlsState.jump = true; });
    btnJump.addEventListener('touchend', () => { window.mobileControlsState.jump = false; });
    btnJump.addEventListener('touchcancel', () => { window.mobileControlsState.jump = false; });
}

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    frames++;
    
    let dt = (currentTime - lastTime) / 16.666; 
    lastTime = currentTime;

    if (dt > 3.0 || isNaN(dt)) dt = 1.0;

    if (currentTime >= fpsLastTime + 1000) {
        if (fpsDisplay) fpsDisplay.innerText = `FPS: ${frames}`;
        frames = 0;
        fpsLastTime = currentTime;
    }
    
    updatePlayer(camera, dt);
    updateWorldChunks(camera, scene, blockGeometry, blockMaterial);

    // REAL-TIME COORDINATES TICKER: Convert matrix coordinates to game units
    if (coordsDisplay && camera) {
        const cx = Math.floor(camera.position.x);
        const cy = Math.floor(camera.position.y - PLAYER_HEIGHT); // Measures surface block position beneath feet
        const cz = Math.floor(camera.position.z);
        coordsDisplay.innerHTML = `X: <span class="text-indigo-400">${cx}</span> Y: <span class="text-indigo-400">${cy}</span> Z: <span class="text-indigo-400">${cz}</span>`;
    }

    window.mobileControlsState.actionBreak = false;
    window.mobileControlsState.actionPlace = false;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', () => {
    initEngine();
    animate();
});
