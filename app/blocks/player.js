// --- PLAYER STATE ---
let playerVelocity = new THREE.Vector3(0, 0, 0);
let canJump = false;
const keys = {};

/**
 * Sets up Keyboard and Pointer Lock Listeners
 */
function initPlayerInputs() {
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    // Pointer Lock for FPS-style controls
    document.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            // Horizontal rotation (Left/Right)
            camera.rotation.y -= e.movementX * 0.002;

            // Vertical rotation (Up/Down)
            camera.rotation.x -= e.movementY * 0.002;

            // Clamp vertical rotation to 85 degrees to avoid gimbal lock/flipping
            const minMaxLook = Math.PI / 2.1;
            camera.rotation.x = Math.max(-minMaxLook, Math.min(minMaxLook, camera.rotation.x));
        }
    });
}

/**
 * Updates Player Physics and Movement
 */
function updatePlayer(camera) {
    // 1. GRAVITY & VERTICAL PHYSICS
    playerVelocity.y += GRAVITY;
    camera.position.y += playerVelocity.y;

    // 2. FLOOR COLLISION (Uses Terrain Height)
    // Ensure getTerrainHeight is accessible here
    const groundY = getTerrainHeight(camera.position.x, camera.position.z);
    const targetEyeLevel = groundY + PLAYER_HEIGHT;

    if (camera.position.y <= targetEyeLevel) {
        camera.position.y = targetEyeLevel;
        playerVelocity.y = 0;
        canJump = true;
    } else {
        canJump = false; // Player is in the air
    }

    // 3. JUMPING
    if (keys['Space'] && canJump) {
        playerVelocity.y = JUMP_FORCE;
        canJump = false;
    }

    // 4. WASD MOVEMENT (Planar)
    const moveDir = new THREE.Vector3();

    // Determine input direction
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();

        // PROJECT MOVEMENT ONTO HORIZONTAL PLANE
        // We use the camera's Y-rotation only so looking up/down doesn't slow us down
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

        // Calculate final displacement
        const finalMove = forward.multiplyScalar(-moveDir.z).add(right.multiplyScalar(moveDir.x));

        camera.position.x += finalMove.x * SPEED;
        camera.position.z += finalMove.z * SPEED;
    }
}
