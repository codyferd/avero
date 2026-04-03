// --- PLAYER STATE ---
let playerVelocity = new THREE.Vector3(0, 0, 0);
let canJump = false;
const keys = {};

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // Center of screen

/**
 * Sets up Keyboard and Mouse Listeners
 */
function initPlayerInputs() {
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    // Pointer Lock & Interaction
    document.addEventListener('mousedown', (e) => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
            return;
        }

        // Left Click = Destroy (0), Right Click = Place (2)
        if (e.button === 0) handleBlockInteraction('destroy');
        if (e.button === 2) handleBlockInteraction('place');
    });

        // Prevent context menu on right-click
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

/**
 * Core Block Interaction Logic
 */
function handleBlockInteraction(mode) {
    // 1. Point raycaster from center of camera
    raycaster.setFromCamera(mouse, camera);
    raycaster.far = 8; // Reach distance (8 blocks)

    // 2. Get all chunk meshes
    const chunkMeshes = Array.from(chunks.values());
    const intersects = raycaster.intersectObjects(chunkMeshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object; // The InstancedMesh we hit
        const instanceId = hit.instanceId;

        if (mode === 'destroy') {
            // HIDE THE BLOCK: Set matrix to a scale of 0
            const matrix = new THREE.Matrix4();
            matrix.makeScale(0, 0, 0);
            mesh.setMatrixAt(instanceId, matrix);
            mesh.instanceMatrix.needsUpdate = true;
        }
        else if (mode === 'place') {
            // FIND PLACEMENT POSITION: Hit position + face normal
            const normal = hit.face.normal.clone();

            // Get the position of the block we hit
            const hitMatrix = new THREE.Matrix4();
            mesh.getMatrixAt(instanceId, hitMatrix);
            const pos = new THREE.Vector3().setFromMatrixPosition(hitMatrix);

            // Add the normal to get the empty space next to it
            const placeX = Math.round(pos.x + normal.x);
            const placeY = Math.round(pos.y + normal.y);
            const placeZ = Math.round(pos.z + normal.z);

            // Check if we have room in the InstancedMesh for a new block
            if (mesh.count < mesh.instanceMatrix.count) {
                const newId = mesh.count;
                const newMatrix = new THREE.Matrix4().setPosition(placeX, placeY, placeZ);

                mesh.setMatrixAt(newId, newMatrix);
                // Default to Dirt/Stone color for placed blocks
                _tempColor.setHex(0x6d4c41);
                mesh.setColorAt(newId, _tempColor);

                mesh.count++;
                mesh.instanceMatrix.needsUpdate = true;
                mesh.instanceColor.needsUpdate = true;
            }
        }
    }
}

/**
 * Updates Player Physics (Remains the same)
 */
function updatePlayer(camera) {
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

    if (keys['Space'] && canJump) {
        playerVelocity.y = JUMP_FORCE;
        canJump = false;
    }

    const moveDir = new THREE.Vector3();
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const finalMove = forward.multiplyScalar(-moveDir.z).add(right.multiplyScalar(moveDir.x));

        camera.position.x += finalMove.x * SPEED;
        camera.position.z += finalMove.z * SPEED;
    }
}

