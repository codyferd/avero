const { createApp, ref, reactive, onMounted, computed } = Vue;

createApp({
    setup() {
        const volume = ref(50);
        const batteryLevel = ref(0);
        const isCharging = ref(false);
        const clipboardContent = ref('');
        const isOnline = ref(navigator.onLine);
        const latency = ref(0);

        // Connection Info
        const connectionType = ref('Unknown');
        const downlink = ref(0);

        // Memory Info
        const usedHeap = ref(0);
        const totalHeap = ref(1);

        const states = reactive({
            notifications: ("Notification" in window && Notification.permission === "granted")
        });

        const toggle = async (key) => {
            if (key === 'notifications' && !states.notifications) {
                const permission = await Notification.requestPermission();
                states.notifications = (permission === 'granted');
            } else {
                states[key] = !states[key];
            }
        };

        const readClipboard = async () => {
            try {
                clipboardContent.value = await navigator.clipboard.readText();
            } catch (err) {
                clipboardContent.value = "Secure Access Required";
            }
        };

        const updateNetworkInfo = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                connectionType.value = conn.effectiveType || 'N/A';
                downlink.value = conn.downlink || 0;
            }
            isOnline.value = navigator.onLine;
        };

        const updateMemory = () => {
            if (performance.memory) {
                usedHeap.value = Math.round(performance.memory.usedJSHeapSize / 1048576);
                totalHeap.value = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
            }
        };

        const updateLatency = () => {
            const start = Date.now();
            fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
            .then(() => { latency.value = Date.now() - start; });
        };

        onMounted(() => {
            // Battery
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
            }

            // Network Listeners
            window.addEventListener('online', updateNetworkInfo);
            window.addEventListener('offline', updateNetworkInfo);
            updateNetworkInfo();

            // Refresh Loops
            setInterval(updateMemory, 2000);
            setInterval(updateLatency, 5000);
            updateMemory();
            updateLatency();
        });

        return {
            volume, batteryLevel, isCharging, isOnline,
            connectionType, downlink, clipboardContent,
            states, latency, usedHeap,
            memoryUsage: computed(() => usedHeap.value),
          memoryPercent: computed(() => (usedHeap.value / totalHeap.value) * 100),
          toggle, readClipboard
        };
    }
}).mount('#app');
