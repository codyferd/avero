const { createApp, ref, reactive, onMounted, computed, onBeforeUnmount } = Vue;

createApp({
    setup() {
        // Dynamic Live Loop References
        const batteryLevel = ref(0);
        const isCharging = ref(false);
        const isOnline = ref(navigator.onLine);
        const latency = ref(0);
        const uptime = ref(0);
        const connectionType = ref('Unknown');
        const downlink = ref(0);

        const displayMetrics = reactive({
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            orientationType: 'Unknown',
            refreshRate: 'Estimating...'
        });

        const location = reactive({
            latitude: 'No Lock',
            longitude: 'No Lock',
            accuracy: 'N/A'
        });

        // Advanced Fetch Data Structural Registry
        const fetchData = reactive({
            os: 'Generic Device / Web Environment',
            osLogoUrl: 'https://unpkg.com/simple-icons@v11/icons/linux.svg', // Default generic fallback
            browserEngine: 'Unknown Core',
            platform: 'Unknown Platform',
            locale: 'N/A',
            cpuLogical: 'N/A',
            gpuRenderer: 'Scanning Graphics Pipe...',
            themePreference: 'Dark',
            ramUsed: 0,
            ramTotal: 'Unsupported'
        });

        // WebGL Driver Sniffer Engine
        const discoverGraphicsHardware = () => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (!gl) {
                    fetchData.gpuRenderer = "Software Canvas Mode";
                    return;
                }
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    fetchData.gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                } else {
                    fetchData.gpuRenderer = gl.getParameter(gl.RENDERER);
                }
            } catch (e) {
                fetchData.gpuRenderer = "Hardware Access Denied";
            }
        };

        // FIXED: Pure Dynamic User Agent Parser & Branding Asset Map
        const analyzePlatformEnvironment = () => {
            const ua = navigator.userAgent;
            const platformStr = navigator.userAgentData?.platform || navigator.platform || '';
            
            fetchData.locale = navigator.language || 'en-US';
            fetchData.cpuLogical = navigator.hardwareConcurrency || 'Generic';
            fetchData.platform = platformStr || 'Web App Sandbox';

            // Extract Light/Dark configuration states
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                fetchData.themePreference = 'Light';
            }

            // Engine Architecture Parse Matchers
            if (ua.includes("Firefox")) fetchData.browserEngine = "Gecko (Firefox)";
            else if (ua.includes("Chrome")) fetchData.browserEngine = "Blink (Chromium Engine)";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) fetchData.browserEngine = "WebKit (Safari)";

            // System OS Matrix mapping directly to Simple Icons vector CDNs
            const osMap = [
                { test: /Android/i, name: 'Android OS', icon: 'android' },
                { test: /iPhone|iPad|iPod/i, name: 'iOS Environment', icon: 'apple' },
                { test: /CrOS/i, name: 'ChromeOS', icon: 'googlechrome' },
                { test: /Windows/i, name: 'Windows OS', icon: 'windows' },
                { test: /Macintosh|Mac OS X/i, name: 'macOS', icon: 'apple' },
                { test: /Linux/i, name: 'Linux', icon: 'linux' }
            ];

            // Evaluate platform without hardcoded overrides
            let matched = false;
            for (const system of osMap) {
                if (system.test.test(ua) || system.test.test(platformStr)) {
                    fetchData.os = system.name;
                    fetchData.osLogoUrl = `https://unpkg.com/simple-icons@v11/icons/${system.icon}.svg`;
                    matched = true;
                    break;
                }
            }

            // Fallback baseline if all strings turn up empty
            if (!matched) {
                fetchData.os = 'Web Application Environment';
                fetchData.osLogoUrl = 'https://unpkg.com/simple-icons@v11/icons/thealgorithms.svg';
            }
        };

        // Frame Sync Execution Loop for Display Refreshes
        const estimateScreenRefreshRate = () => {
            let totalFrames = 0;
            let startTime = performance.now();
            
            const countFrame = () => {
                totalFrames++;
                const elapsed = performance.now() - startTime;
                if (elapsed >= 1000) {
                    displayMetrics.refreshRate = Math.round((totalFrames * 1000) / elapsed);
                } else {
                    requestAnimationFrame(countFrame);
                }
            };
            requestAnimationFrame(countFrame);
        };

        const updateDisplayTracking = () => {
            displayMetrics.screenWidth = window.screen.width;
            displayMetrics.screenHeight = window.screen.height;
            displayMetrics.orientationType = window.screen.orientation ? window.screen.orientation.type : 'Standard';
        };

        const acquireLocation = () => {
            if (!navigator.geolocation) {
                location.latitude = 'API Fault';
                return;
            }
            location.latitude = 'Acquiring...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    location.latitude = pos.coords.latitude.toFixed(5);
                    location.longitude = pos.coords.longitude.toFixed(5);
                    location.accuracy = `±${Math.round(pos.coords.accuracy)}m`;
                },
                () => {
                    location.latitude = 'Refused/Locked';
                    location.longitude = 'N/A';
                    location.accuracy = 'N/A';
                },
                { enableHighAccuracy: true, timeout: 6000 }
            );
        };

        const updateNetworkStats = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                connectionType.value = conn.effectiveType || 'Ethernet/Wi-Fi';
                downlink.value = conn.downlink || 0;
            }
            isOnline.value = navigator.onLine;
        };

        const checkV8Allocations = () => {
            if (performance && performance.memory) {
                fetchData.ramUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
                fetchData.ramTotal = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
            }
        };

        const calculateEchoLatency = () => {
            const departure = Date.now();
            fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
            .then(() => { latency.value = Date.now() - departure; })
            .catch(() => { latency.value = 'Offline'; });
        };

        onMounted(() => {
            analyzePlatformEnvironment();
            discoverGraphicsHardware();
            updateDisplayTracking();
            estimateScreenRefreshRate();

            if (navigator.getBattery) {
                navigator.getBattery().then(batt => {
                    const syncPower = () => {
                        batteryLevel.value = Math.floor(batt.level * 100);
                        isCharging.value = batt.charging;
                    };
                    syncPower();
                    batt.onlevelchange = syncPower;
                    batt.onchargingchange = syncPower;
                });
            } else {
                batteryLevel.value = 100;
                isCharging.value = true;
            }

            window.addEventListener('resize', updateDisplayTracking);
            window.addEventListener('online', updateNetworkStats);
            window.addEventListener('offline', updateNetworkStats);
            updateNetworkStats();

            setInterval(checkV8Allocations, 2000);
            setInterval(calculateEchoLatency, 5000);
            setInterval(() => { uptime.value++; }, 1000);

            checkV8Allocations();
            calculateEchoLatency();
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', updateDisplayTracking);
            window.removeEventListener('online', updateNetworkStats);
            window.removeEventListener('offline', updateNetworkStats);
        });

        return {
            batteryLevel, isCharging, isOnline,
            connectionType, downlink, latency, uptime,
            displayMetrics, location, fetchData,
            memoryPercent: computed(() => {
                if (fetchData.ramTotal === 'Unsupported' || !fetchData.ramTotal) return 0;
                return Math.round((fetchData.ramUsed / fetchData.ramTotal) * 100);
            }),
            acquireLocation
        };
    }
}).mount('#app');
