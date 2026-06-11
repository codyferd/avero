let playerVelocity = new THREE.Vector3(0, 0, 0);
let canJump = false;
const keys = {};

let selectedBlock = BLOCKS.GRASS; 

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); 

function initPlayerInputs() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        const blockKeys = Object.keys(BLOCKS);
        let currentIndex = blockKeys.indexOf(
            Object.keys(BLOCKS).find(key => BLOCKS[key] === selectedBlock)
        );

        if (e.code === 'KeyQ') {
            currentIndex = (currentIndex - 1 + blockKeys.length) % blockKeys.length;
            selectedBlock = BLOCKS[blockKeys[currentIndex]];
            updatePickerUI();
        }

        if (e.code === 'KeyE') {
            currentIndex = (currentIndex + 1) % blockKeys.length;
            selectedBlock = BLOCKS[blockKeys[currentIndex]];
            updatePickerUI();
        }
    });

    window.addEventListener('keyup', (e) => keys[e.code] = false);

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('#hotbar') || e.target.closest('#mobile-overlay')) return;

        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
            return;
        }

        if (e.button === 0) handleBlockInteraction('destroy');
        if (e.button === 2) handleBlockInteraction('place');
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            const minMaxLook = Math.PI / 2.1;
            camera.rotation.x = Math.max(-minMaxLook, Math.min(minMaxLook, camera.rotation.x));
        }
    });
}

function initBlockPicker() {
    const hotbar = document.getElementById('hotbar');
    if (!hotbar) return;

    Object.keys(BLOCKS).forEach(key => {
        const type = BLOCKS[key];
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.block = key;
        slot.style.backgroundColor = `#${type.color.toString(16).padStart(6, '0')}`;

        if (type === selectedBlock) slot.classList.add('active');

        // Added touchstart listener alongside mousedown for seamless hotbar tapping on mobile
        const selectHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            selectedBlock = type;
            updatePickerUI();
        };

        slot.addEventListener('mousedown', selectHandler);
        slot.addEventListener('touchstart', selectHandler, { passive: false });

        hotbar.appendChild(slot);
    });
}

function updatePickerUI() {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.toggle('active', BLOCKS[slot.dataset.block] === selectedBlock);
    });
}

function handleBlockInteraction(mode) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 8;

    const chunkMeshes = Array.from(chunks.values());
    const intersects = raycaster.intersectObjects(chunkMeshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object;
        const instanceId = hit.instanceId;

        if (mode === 'destroy') {
            const matrix = new THREE.Matrix4();
            matrix.makeScale(0, 0, 0); 
            mesh.setMatrixAt(instanceId, matrix);
            mesh.instanceMatrix.needsUpdate = true;
        }
        else if (mode === 'place') {
            const normal = hit.face.normal.clone();
            const hitMatrix = new THREE.Matrix4();
            mesh.getMatrixAt(instanceId, hitMatrix);
            const pos = new THREE.Vector3().setFromMatrixPosition(hitMatrix);

            const px = Math.round(pos.x + normal.x);
            const py = Math.round(pos.y + normal.y);
            const pz = Math.round(pos.z + normal.z);

            if (mesh.count < mesh.instanceMatrix.count) {
                placeBlock(mesh.count, px, py, pz, selectedBlock, mesh);
                mesh.count++;
                mesh.instanceMatrix.needsUpdate = true;
                mesh.instanceColor.needsUpdate = true;
            }
        }
    }
}

function updatePlayer(camera) {
    // 1. Process Mobile Pulse Inputs for action triggers
    if (window.mobileControlsState.actionBreak) handleBlockInteraction('destroy');
    if (window.mobileControlsState.actionPlace) handleBlockInteraction('place');

    // 2. Physics & Gravity
    playerVelocity.y += GRAVITY;
    camera.position.y += playerVelocity.y;

    const groundY = getTerrainHeight(camera.position.x, camera.position.z);
    const targetEyeLevel = groundY + PLAYER_HEIGHT;

    if (camera.position.y <= targetEyeLevel) {
        camera.position.y = targetEyeLevel;
        playerVelocity.y = 0;
        canJump = true;
    } else {
        canJump = false;
    }

    // 3. Jump Action Handler (Keyboard + Mobile)
    const jumpRequested = keys['Space'] || window.mobileControlsState.jump;
    if (jumpRequested && canJump) {
        playerVelocity.y = JUMP_FORCE;
        canJump = false;
    }

    // 4. Direction Vectors Blending Calculation
    const moveDir = new THREE.Vector3();
    
    // Read keyboard values
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;

    // Blend joystick normalization variables if keyboard is idle
    if (moveDir.lengthSq() === 0) {
        moveDir.z += window.mobileControlsState.moveBackward;
        moveDir.z -= window.mobileControlsState.moveForward;
        moveDir.x += window.mobileControlsState.moveRight;
        moveDir.x -= window.mobileControlsState.moveLeft;
    }

    if (moveDir.lengthSq() > 0) {
        // Normalize directional vectors without flattening analog magnitude variations
        const magnitude = Math.min(moveDir.length(), 1);
        moveDir.normalize();
        
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const finalMove = forward.multiplyScalar(-moveDir.z).add(right.multiplyScalar(moveDir.x));

        camera.position.x += finalMove.x * SPEED * magnitude;
        camera.position.z += finalMove.z * SPEED * magnitude;
    }
}
