const { createApp, ref, onMounted, computed, nextTick } = Vue;

createApp({
    setup() {
        const loading = ref(true);
        const weather = ref(null);
        const cityName = ref('Detecting...');
        const cityInput = ref('');
        const weatherDesc = ref('Searching...');
        const unit = ref('K'); // Default to Kelvin for Avero standard
        const currentTime = ref('--:--');

        // Expanded for better atmospheric reporting
        const interpretCode = (code) => {
            const map = {
                0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
          45: 'Foggy', 51: 'Drizzle', 61: 'Light Rain', 63: 'Rain',
          71: 'Snowfall', 80: 'Rain Showers', 95: 'Thunderstorm'
            };
            return map[code] || 'Atmospheric Event';
        };

        // Updated to prioritize rain icons over thermal icons
        const getThermalEmoji = (c, rainChance = 0) => {
            if (rainChance > 40) return '🌧️';
            if (c >= 30) return '☀️';
            if (c >= 20) return '🌤️';
            if (c >= 10) return '🌥️';
            if (c >= 0) return '🌨️';
            return '🧊';
        };

        const convertTemp = (c) => {
            if (unit.value === 'K') return (parseFloat(c) + 273.15).toFixed(1);
            if (unit.value === 'F') return ((parseFloat(c) * 9/5) + 32).toFixed(0);
            return Math.round(c);
        };

        // Now includes rain probability in the 24h projection
        const hourlySlice = computed(() => {
            if (!weather.value) return [];
            const now = new Date();
            const hourIndex = weather.value.hourly.time.findIndex(t => new Date(t) > now);
            const start = hourIndex !== -1 ? hourIndex : 0;

            return weather.value.hourly.time.slice(start, start + 24).map((time, i) => ({
                time,
                temp: weather.value.hourly.temperature_2m[start + i],
                rainChance: weather.value.hourly.precipitation_probability[start + i]
            }));
        });

        const fetchWeather = async (lat, lon) => {
            loading.value = true;
            try {
                // ADDED: precipitation and precipitation_probability to params
                const params = `current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&hourly=temperature_2m,precipitation_probability&timezone=auto`;
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${params}`);
                weather.value = await res.json();
                weatherDesc.value = interpretCode(weather.value.current.weather_code);

                // Dynamic UI Accents based on conditions
                const temp = weather.value.current.temperature_2m;
                const rain = weather.value.current.precipitation_probability;
                let color = '#6366f1'; // Default Avero Purple
                if (rain > 30) color = '#3b82f6'; // Rainy Blue
                else if (temp > 25) color = '#fbbf24'; // Sunny Gold
                else if (temp < 5) color = '#60a5fa'; // Cold Azure

                document.documentElement.style.setProperty('--avero-accent', color);
            } catch (e) {
                console.error("Sync Failure", e);
            } finally {
                loading.value = false;
            }
        };

        const getCityName = async (lat, lon) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await res.json();
                cityName.value = data.address.city || data.address.town || data.address.village || 'Nexus Point';
            } catch (e) { cityName.value = 'Nexus Point'; }
        };

        const getWeatherByCity = async () => {
            if (!cityInput.value) return;
            loading.value = true;
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput.value)}&count=1`);
                const data = await res.json();
                if (data.results?.[0]) {
                    const l = data.results[0];
                    cityName.value = l.name;
                    await fetchWeather(l.latitude, l.longitude);
                }
            } catch (e) { alert("Target location not found"); }
            finally { cityInput.value = ''; loading.value = false; }
        };

        const formatDate = (d) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(d));
        const formatTime = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const formatAstroTime = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

        const updateClock = () => {
            currentTime.value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        };

        onMounted(() => {
            setInterval(updateClock, 1000);
            updateClock();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (p) => {
                        await getCityName(p.coords.latitude, p.coords.longitude);
                        await fetchWeather(p.coords.latitude, p.coords.longitude);
                    },
                    () => fetchWeather(40.7128, -74.0060) // Fallback to NYC
                );
            }
        });

        return {
            loading, weather, cityName, cityInput, weatherDesc, unit, currentTime,
          getWeatherByCity, formatDate, formatTime, formatAstroTime, convertTemp, getThermalEmoji, hourlySlice
        };
    }
}).mount('#app');
