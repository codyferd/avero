// Expose the engine globally to allow seamless interaction with index.js hooks
window.Avero3DEngine = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animationId: null,
    resizeHandler: null,

    init(container, modelUrl) {
        // Clean out any lingering instances before building
        this.destroy();

        // Safe resolution for external loaders based on different CDN version allocations
        const GLTFLoaderClass = THREE.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
        const OrbitControlsClass = THREE.OrbitControls || (window.THREE && window.THREE.OrbitControls);

        if (!GLTFLoaderClass) {
            console.error("GLTFLoader missing. Check script imports.");
            return;
        }

        // Fix: Force fallback dimensions if layout calculation hasn't completely painted yet
        let width = container.clientWidth || container.offsetWidth || 800;
        let height = container.clientHeight || container.offsetHeight || 500;

        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#070707');

        // 2. Camera Setup
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // 3. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        // Safe mapping configuration for color space transformations
        if (THREE.ColorManagement) THREE.ColorManagement.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace || 'sRGB';

        container.appendChild(this.renderer.domElement);

        // 4. Interactive Navigation Orbit Controls
        if (OrbitControlsClass) {
            this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }

        // 5. Studio Stage Lighting Pack
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight('#ffffff', 1.5);
        dirLight1.position.set(5, 10, 7);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight('#6366f1', 0.8);
        dirLight2.position.set(-5, -5, -5);
        this.scene.add(dirLight2);

        // 6. Loading the 3D Asset File Runtime Data
        const loader = new GLTFLoaderClass();
        loader.load(modelUrl, (gltf) => {
            const model = gltf.scene;

            // Fix model scaling and center it perfectly within user camera frustum
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y);
            model.position.z += (model.position.z - center.z);

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 2.5 / maxDim;
                model.scale.set(scale, scale, scale);
            }

            this.scene.add(model);
        }, undefined, (error) => {
            console.error('An error occurred loading the 3D model architecture asset:', error);
        });

        // 7. Event Listener for Responsive Sizing
        this.resizeHandler = () => {
            if (!container || !this.camera || !this.renderer) return;
            const w = container.clientWidth || container.offsetWidth;
            const h = container.clientHeight || container.offsetHeight;
            if (w === 0 || h === 0) return;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };
        window.addEventListener('resize', this.resizeHandler);

        // 8. Animation/Render Loop
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    },

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        if (this.renderer) {
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }
        this.scene = null;
        this.camera = null;
    }
};
