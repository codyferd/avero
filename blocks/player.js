// --- PLAYER CONTROLS & PHYSICS ENGINE SUBSYSTEM ---
let playerVelocity = new THREE.Vector3(0, 0, 0);
let canJump = false;
const keys = {};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); 

// Global map tracker to communicate block updates directly to the physics engine loop
window.placedBlocks = window.placedBlocks || new Map();

function initPlayerInputs() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => keys[e.code] = false);

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('#hud') || e.target.closest('#mobile-overlay')) return;

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
            camera.rotation.y -= e.movementX * 0.0022;
            camera.rotation.x -= e.movementY * 0.0022;
            const minMaxLook = Math.PI / 2.1;
            camera.rotation.x = Math.max(-minMaxLook, Math.min(minMaxLook, camera.rotation.x));
        }
    });
}

function handleBlockInteraction(mode) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 7;

    const chunkMeshes = Array.from(chunks.values());
    const intersects = raycaster.intersectObjects(chunkMeshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object;
        const instanceId = hit.instanceId;

        // Extract accurate world positions from the target matrix transformation
        const hitMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(instanceId, hitMatrix);
        const currentTargetPos = new THREE.Vector3().setFromMatrixPosition(hitMatrix);
        const bx = Math.round(currentTargetPos.x);
        const by = Math.round(currentTargetPos.y);
        const bz = Math.round(currentTargetPos.z);

        if (mode === 'destroy') {
            const matrix = new THREE.Matrix4();
            matrix.makeScale(0, 0, 0); 
            mesh.setMatrixAt(instanceId, matrix);
            mesh.instanceMatrix.needsUpdate = true;

            // Log explicitly that this position is now empty air
            const key = `${bx},${by},${bz}`;
            window.placedBlocks.set(key, 'AIR');
        }
        else if (mode === 'place') {
            if (!hit.face || !hit.face.normal) return;

            const normal = hit.face.normal.clone();
            const px = Math.round(bx + normal.x);
            const py = Math.round(by + normal.y);
            const pz = Math.round(bz + normal.z);

            // AABB check: Prevent placing a block directly inside the player's body frame
            const pFloorX = Math.round(camera.position.x);
            const pFloorZ = Math.round(camera.position.z);
            const pFeetY = Math.round(camera.position.y - PLAYER_HEIGHT);
            const pHeadY = Math.round(camera.position.y);

            if (px === pFloorX && pz === pFloorZ && (py === pFeetY || py === pHeadY)) {
                return; // Stop processing placement
            }

            if (mesh.count < mesh.instanceMatrix.count) {
                placeBlock(mesh.count, px, py, pz, selectedBlock, mesh);
                mesh.count++;
                mesh.instanceMatrix.needsUpdate = true;
                mesh.instanceColor.needsUpdate = true;

                // Log the presence of a newly placed solid block
                const key = `${px},${py},${pz}`;
                window.placedBlocks.set(key, 'BLOCK');
            }
        }
    }
}

function updatePlayer(camera, dt) {
    if (window.mobileControlsState.actionBreak) handleBlockInteraction('destroy');
    if (window.mobileControlsState.actionPlace) handleBlockInteraction('place');

    playerVelocity.y += GRAVITY * dt;
    camera.position.y += playerVelocity.y * dt;

    const pX = Math.round(camera.position.x);
    const pZ = Math.round(camera.position.z);

    // 1. Grab baseline structural ground limits from procedural settings
    let groundY = TERRAIN_BASE_HEIGHT;
    if (typeof window.getTerrainHeight === 'function') {
        groundY = window.getTerrainHeight(camera.position.x, camera.position.z).height;
    }

    // 2. Scan the current column vertically upwards to find the highest player-placed block
    for (let checkY = groundY - 5; checkY < groundY + 30; checkY++) {
        const key = `${pX},${checkY},${pZ}`;
        const state = window.placedBlocks.get(key);
        if (state === 'BLOCK') {
            if (checkY >= groundY) {
                groundY = checkY + 1; 
            }
        }
    }

    // 3. Scan downwards to see if a procedural terrain surface block was dug away
    let terrainSurfaceBroken = true;
    while (terrainSurfaceBroken && groundY > 0) {
        const checkSurfaceKey = `${pX},${groundY - 1},${pZ}`;
        if (window.placedBlocks.get(checkSurfaceKey) === 'AIR') {
            groundY--; // Fall through into the dug hole
        } else {
            terrainSurfaceBroken = false;
        }
    }

    const targetEyeLevel = groundY + PLAYER_HEIGHT;

    if (camera.position.y <= targetEyeLevel) {
        camera.position.y = targetEyeLevel;
        playerVelocity.y = 0;
        canJump = true;
    } else {
        canJump = false;
    }

    const jumpRequested = keys['Space'] || window.mobileControlsState.jump;
    if (jumpRequested && canJump) {
        playerVelocity.y = JUMP_FORCE; 
        canJump = false;
    }

    const moveDir = new THREE.Vector3();
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;

    if (moveDir.lengthSq() === 0) {
        moveDir.z += window.mobileControlsState.moveBackward;
        moveDir.z -= window.mobileControlsState.moveForward;
        moveDir.x += window.mobileControlsState.moveRight;
        moveDir.x -= window.mobileControlsState.moveLeft;
    }

    if (moveDir.lengthSq() > 0) {
        const magnitude = Math.min(moveDir.length(), 1);
        moveDir.normalize();
        
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const finalMove = forward.multiplyScalar(-moveDir.z).add(right.multiplyScalar(moveDir.x));

        camera.position.x += finalMove.x * SPEED * magnitude * dt;
        camera.position.z += finalMove.z * SPEED * magnitude * dt;
    }
}
