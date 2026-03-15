const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        const allSeries = ref([]);
        const activeSeries = ref(null);
        const currentEpisode = ref(null);
        const error = ref(null);
        const showInfo = ref(false);

        // New State for Search & Filtering
        const searchQuery = ref("");
        const activeFilter = ref("All");

        const handleLibraryUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            error.value = null;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    allSeries.value = data.library || [];
                } catch (err) { error.value = "JSON Error"; }
            };
            reader.readAsText(file);
        };

        // Filter Logic
        const filteredLibrary = computed(() => {
            return allSeries.value.filter(item => {
                const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase());
                const matchesFilter = activeFilter.value === "All" || item.medium === activeFilter.value;
                return matchesSearch && matchesFilter;
            });
        });

        const filterOptions = computed(() => {
            const types = allSeries.value.map(s => s.medium || "Video");
            return ["All", ...new Set(types)];
        });

        const openSeries = (series) => { activeSeries.value = series; window.scrollTo(0,0); };
        const playEpisode = (episode) => {
            currentEpisode.value = episode;
            setTimeout(() => { if (window.AveroPlayer) window.AveroPlayer.init('video-player', episode); }, 150);
        };

        return {
            allSeries, activeSeries, currentEpisode, error, showInfo,
            searchQuery, activeFilter, filteredLibrary, filterOptions,
            handleLibraryUpload, openSeries, playEpisode
        };
    }
}).mount("#app");
