const { createApp, ref, reactive, onMounted, computed, onBeforeUnmount } = Vue;

createApp({
    setup() {
        // Core System Hooks
        const batteryLevel = ref(0);
        const isCharging = ref(false);
        const clipboardContent = ref('');
        const isOnline = ref(navigator.onLine);
        const latency = ref(0);
        const uptime = ref(0);

        // Network Topology Metrics
        const connectionType = ref('Unknown');
        const downlink = ref(0);

        // Memory State Buffers
        const usedHeap = ref(0);
        const totalHeap = ref(1);

        // Web Audio Synthesizer Controls
        const synthesizerFrequency = ref(440);
        const isSynthPlaying = ref(false);
        let audioContext = null;
        let oscillatorNode = null;
        let mainGainNode = null;

        // Display Coordinate States
        const displayMetrics = reactive({
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        });

        // Gyroscope Telemetry Orientations
        const orientation = reactive({
            alpha: '0.0',
            beta: '0.0',
            gamma: '0.0'
        });

        // Geolocation coordinate frames
        const location = reactive({
            latitude: 'No Lock',
            longitude: 'No Lock',
            accuracy: 'N/A'
        });

        const states = reactive({
            notifications: ("Notification" in window && Notification.permission === "granted")
        });

        // Toggle Switch Interface Route
        const toggle = async (key) => {
            if (key === 'notifications' && !states.notifications) {
                const permission = await Notification.requestPermission();
                states.notifications = (permission === 'granted');
            } else {
                states[key] = !states[key];
            }
        };

        // Standard Text Clipboard Node Interception
        const readClipboard = async () => {
            try {
                clipboardContent.value = await navigator.clipboard.readText();
            } catch (err) {
                clipboardContent.value = "Security Sandbox Exception - Click/Focus Required";
            }
        };

        // Dynamic Display Resolution Rescaling Frame Hooks
        const updateDisplayDimensions = () => {
            displayMetrics.windowWidth = window.innerWidth;
            displayMetrics.windowHeight = window.innerHeight;
            displayMetrics.screenWidth = window.screen.width;
            displayMetrics.screenHeight = window.screen.height;
        };

        // Geolocation Lock Vector Acquisition
        const acquireLocation = () => {
            if (!navigator.geolocation) {
                location.latitude = 'Unsupported API';
                return;
            }
            location.latitude = 'Acquiring...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    location.latitude = pos.coords.latitude.toFixed(5);
                    location.longitude = pos.coords.longitude.toFixed(5);
                    location.accuracy = `±${Math.round(pos.coords.accuracy)}m`;
                },
                (err) => {
                    location.latitude = 'Denied/Timeout';
                    location.longitude = 'Locked out';
                    location.accuracy = 'N/A';
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        };

        // Mobile Vibration Haptic Burst Routing
        const triggerHapticPulse = () => {
            if (navigator.vibrate) {
                // Double pulse haptic sequencing pattern (100ms rumble, 50ms dead gap, 100ms rumble)
                navigator.vibrate([100, 50, 100]);
            }
        };

        // Gyroscopic Sensor Matrix Telemetry Processing Loop
        const handleDeviceMotion = (event) => {
            orientation.alpha = event.alpha ? event.alpha.toFixed(1) : '0.0';
            orientation.beta = event.beta ? event.beta.toFixed(1) : '0.0';
            orientation.gamma = event.gamma ? event.gamma.toFixed(1) : '0.0';
        };

        // Interactive Synth Core Logic
        const toggleSynth = () => {
            if (isSynthPlaying.value) {
                stopOscillatorSignal();
            } else {
                startOscillatorSignal();
            }
        };

        const startOscillatorSignal = () => {
            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Initialize clean architectural wave pipeline
                oscillatorNode = audioContext.createOscillator();
                mainGainNode = audioContext.createGain();
                
                oscillatorNode.type = 'sine';
                oscillatorNode.frequency.setValueAtTime(synthesizerFrequency.value, audioContext.currentTime);
                
                // Soft initialization clamp to prevent high sound pop errors
                mainGainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
                mainGainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1); 
                
                oscillatorNode.connect(mainGainNode);
                mainGainNode.connect(audioContext.destination);
                
                oscillatorNode.start();
                isSynthPlaying.value = true;
            } catch (err) {
                console.error("Audio Synthesis Allocation Fault:", err);
            }
        };

        const updateOscillator = () => {
            if (isSynthPlaying.value && oscillatorNode && audioContext) {
                oscillatorNode.frequency.setValueAtTime(synthesizerFrequency.value, audioContext.currentTime);
            }
        };

        const stopOscillatorSignal = () => {
            if (oscillatorNode && mainGainNode && audioContext) {
                try {
                    mainGainNode.gain.setValueAtTime(mainGainNode.gain.value, audioContext.currentTime);
                    mainGainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.05);
                    oscillatorNode.stop(audioContext.currentTime + 0.06);
                } catch(e) {}
                isSynthPlaying.value = false;
            }
        };

        // Network Infrastructure Tracking
        const updateNetworkInfo = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                connectionType.value = conn.effectiveType || 'N/A';
                downlink.value = conn.downlink || 0;
            }
            isOnline.value = navigator.onLine;
        };

        // Local Host V8 Core Engine Profiling Loop
        const updateMemory = () => {
            if (performance && performance.memory) {
                usedHeap.value = Math.round(performance.memory.usedJSHeapSize / 1048576);
                totalHeap.value = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
            }
        };

        // Network Frame Response Diagnostic Pings
        const updateLatency = () => {
            const start = Date.now();
            fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
            .then(() => { latency.value = Date.now() - start; })
            .catch(() => { latency.value = 'Offline'; });
        };

        onMounted(() => {
            // Power Management Array Initialization
            if (navigator.getBattery) {
                navigator.getBattery().then(batt => {
                    const sync = () => {
                        batteryLevel.value = Math.floor(batt.level * 100);
                        isCharging.value = batt.charging;
                    };
                    sync();
                    batt.onlevelchange = sync;
                    batt.onchargingchange = sync;
                });
            } else {
                // Fallback baseline array markers if sandbox architecture strictly blocks access
                batteryLevel.value = 100;
                isCharging.value = true;
            }

            // Window Scale Hook Bindings
            window.addEventListener('resize', updateDisplayDimensions);
            
            // Motion Telemetry Listener Configuration
            window.addEventListener('deviceorientation', handleDeviceMotion, true);

            // Network State Event Array Hooks
            window.addEventListener('online', updateNetworkInfo);
            window.addEventListener('offline', updateNetworkInfo);
            updateNetworkInfo();

            // Background Telemetry System Interval Loops
            setInterval(updateMemory, 2000);
            setInterval(updateLatency, 5000);
            setInterval(() => { uptime.value++; }, 1000);
            
            updateMemory();
            updateLatency();
        });

        onBeforeUnmount(() => {
            // Clean up resources before unmounting to prevent memory leaks
            window.removeEventListener('resize', updateDisplayDimensions);
            window.removeEventListener('deviceorientation', handleDeviceMotion);
            window.removeEventListener('online', updateNetworkInfo);
            window.removeEventListener('offline', updateNetworkInfo);
            stopOscillatorSignal();
        });

        return {
            batteryLevel, isCharging, isOnline,
            connectionType, downlink, clipboardContent,
            states, latency, uptime, usedHeap,
            displayMetrics, orientation, location,
            synthesizerFrequency, isSynthPlaying,
            memoryUsage: computed(() => usedHeap.value || 'N/A'),
            memoryPercent: computed(() => totalHeap.value ? (usedHeap.value / totalHeap.value) * 100 : 0),
            toggle, readClipboard, acquireLocation, triggerHapticPulse, toggleSynth, updateOscillator
        };
    }
}).mount('#app');
