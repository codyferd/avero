const { createApp, ref, computed, reactive, onMounted, onBeforeUnmount } = Vue;

createApp({
    setup() {
        const currentTab = ref('stopwatch');

        // ================== COMPONENT LAYER: STOPWATCH ==================
        const stopwatch = reactive({
            time: 0,
            isRunning: false,
            laps: []
        });
        let stopwatchInterval = null;
        let stopwatchStartTime = 0;

        const formattedStopwatch = computed(() => {
            const totalMs = stopwatch.time;
            const mins = Math.floor(totalMs / 60000);
            const secs = Math.floor((totalMs % 60000) / 1000);
            const ms = Math.floor((totalMs % 1000) / 10);

            return {
                main: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
                ms: ms.toString().padStart(2, '0')
            };
        });

        const toggleStopwatch = () => {
            if (stopwatch.isRunning) {
                clearInterval(stopwatchInterval);
            } else {
                stopwatchStartTime = Date.now() - stopwatch.time;
                stopwatchInterval = setInterval(() => {
                    stopwatch.time = Date.now() - stopwatchStartTime;
                }, 10);
            }
            stopwatch.isRunning = !stopwatch.isRunning;
        };

        const recordLap = () => {
            const f = formattedStopwatch.value;
            stopwatch.laps.push(`${f.main}.${f.ms}`);
        };

        const resetStopwatch = () => {
            clearInterval(stopwatchInterval);
            stopwatch.isRunning = false;
            stopwatch.time = 0;
            stopwatch.laps = [];
        };

        // ================== COMPONENT LAYER: TIMER ==================
        const timer = reactive({
            remainingTime: 0,
            isRunning: false,
            isConfigMode: true,
            isExpired: false
        });

        const timerInput = reactive({ hours: 0, minutes: 0, seconds: 0 });
        let timerInterval = null;
        let timerEndTime = 0;

        const formattedTimer = computed(() => {
            const totalMs = timer.remainingTime;
            const hrs = Math.floor(totalMs / 3600000);
            const mins = Math.floor((totalMs % 3600000) / 60000);
            const secs = Math.floor((totalMs % 60000) / 1000);
            const ms = Math.floor((totalMs % 1000) / 10);

            const hh = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
            return {
                main: `${hh}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
                ms: ms.toString().padStart(2, '0')
            };
        });

        const lockAndStartTimer = () => {
            const h = Math.max(0, parseInt(timerInput.hours) || 0);
            const m = Math.min(59, Math.max(0, parseInt(timerInput.minutes) || 0));
            const s = Math.min(59, Math.max(0, parseInt(timerInput.seconds) || 0));

            const calculatedMs = ((h * 3600) + (m * 60) + s) * 1000;
            if (calculatedMs <= 0) return;

            timer.remainingTime = calculatedMs;
            timer.isConfigMode = false;
            timer.isExpired = false;
            toggleTimer();
        };

        const toggleTimer = () => {
            if (timer.isRunning) {
                clearInterval(timerInterval);
            } else {
                if (timer.isExpired) {
                    timer.isExpired = false;
                    timer.isConfigMode = true;
                    return;
                }
                timerEndTime = Date.now() + timer.remainingTime;
                timerInterval = setInterval(() => {
                    const diff = timerEndTime - Date.now();
                    if (diff <= 0) {
                        timer.remainingTime = 0;
                        timer.isRunning = false;
                        timer.isExpired = true;
                        clearInterval(timerInterval);
                    } else {
                        timer.remainingTime = diff;
                    }
                }, 10);
            }
            timer.isRunning = !timer.isRunning;
        };

        const setPresetTimer = (minutes) => {
            clearInterval(timerInterval);
            timer.isRunning = false;
            timer.isExpired = false;
            timerInput.hours = 0;
            timerInput.minutes = minutes;
            timerInput.seconds = 0;
            timer.remainingTime = minutes * 60 * 1000;
            timer.isConfigMode = false;
        };

        const resetTimer = () => {
            clearInterval(timerInterval);
            timer.isRunning = false;
            timer.isExpired = false;
            timer.remainingTime = 0;
            timer.isConfigMode = true;
        };

        // ================== COMPONENT LAYER: WORLD TIME ==================
        const searchQuery = ref('');
        const systemClockTime = ref(new Date());
        let clockInterval = null;

        const apiState = reactive({ loading: false, error: null });

        const trackedZones = ref([
            { id: '1', label: 'GMT', zone: 'Etc/GMT' },
        ]);

        const localClockDisplay = computed(() => {
            return systemClockTime.value.toLocaleTimeString('en-US', { 
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
            });
        });

        const computedZoneTimes = computed(() => {
            return trackedZones.value.map(item => {
                try {
                    const timeStr = systemClockTime.value.toLocaleTimeString('en-US', {
                        timeZone: item.zone,
                        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    return { ...item, time: timeStr, tzName: item.zone };
                } catch (e) {
                    return { ...item, time: '--:--:--', tzName: 'Unknown Coordinate Bound' };
                }
            });
        });

        // Safe client-facing geocoding engine lookup sequence
        const queryGlobalLocation = async () => {
            const cleanQuery = searchQuery.value.trim();
            if (!cleanQuery) return;

            apiState.loading = true;
            apiState.error = null;

            try {
                // Step 1: Query OpenStreetMap Nominatim Engine
                const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`;
                const response = await fetch(geoUrl, {
                    headers: { 'User-Agent': 'AveroChronometerSystem/2.0' }
                });
                
                const data = await response.json();
                if (!data || data.length === 0) {
                    throw new Error('Location could not be traced');
                }

                const target = data[0];
                const lat = parseFloat(target.lat);
                const lon = parseFloat(target.lon);

                // Step 2: Use a completely open, client-permissive time-zone API (Geonames demo endpoint wrapper)
                // Fallback direct coordinate parsing mechanism if third party limits drop
                const tzUrl = `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=demo`;
                const tzResponse = await fetch(tzUrl);
                const tzData = await tzResponse.json();

                // If demo credentials fail or hit limits, calculate structural GMT offset manually via standard coordinates
                let ianaTimezone = tzData?.timezoneId;
                let fallbackAbbrev = tzData?.timezoneId ? tzData.timezoneId.split('/').pop().replace('_', ' ') : 'GMT';

                if (!ianaTimezone) {
                    const structuralGmtOffset = Math.round(lon / 15);
                    ianaTimezone = 'UTC'; 
                    fallbackAbbrev = `GMT${structuralGmtOffset >= 0 ? '+' : ''}${structuralGmtOffset}`;
                }

                const structuralLabel = target.display_name.split(',')[0] + ` (${fallbackAbbrev})`;
                
                if (trackedZones.value.some(z => z.zone === ianaTimezone && z.label === structuralLabel)) {
                    throw new Error('Location node already registered');
                }

                trackedZones.value.push({
                    id: Date.now().toString(),
                    label: structuralLabel,
                    zone: ianaTimezone
                });

                searchQuery.value = '';
            } catch (err) {
                apiState.error = err.message || 'Network anomaly detected';
            } finally {
                apiState.loading = false;
            }
        };

        const removeZone = (id) => {
            trackedZones.value = trackedZones.value.filter(z => z.id !== id);
        };

        Math.clamp = (min, max, val) => Math.min(Math.max(val, min), max);

        // ================== LIFE CYCLE MATRICES ==================
        onMounted(() => {
            clockInterval = setInterval(() => {
                systemClockTime.value = new Date();
            }, 1000);
        });

        onBeforeUnmount(() => {
            clearInterval(stopwatchInterval);
            clearInterval(timerInterval);
            clearInterval(clockInterval);
        });

        return {
            currentTab,
            stopwatch, formattedStopwatch, toggleStopwatch, recordLap, resetStopwatch,
            timer, timerInput, formattedTimer, lockAndStartTimer, toggleTimer, setPresetTimer, resetTimer,
            searchQuery, localClockDisplay, trackedZones, computedZoneTimes, apiState, queryGlobalLocation, removeZone
        };
    }
}).mount('#app');
