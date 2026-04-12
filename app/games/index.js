const { createApp, ref, onMounted, computed } = Vue;

createApp({
    setup() {
        const allGames = ref([]);
        const selectedGame = ref(null);
        const searchQuery = ref("");

        const initializeLibrary = () => {
            if (typeof sources === 'undefined') {
                console.error("Avero Error: 'sources' is not defined in list.js");
                return;
            }
            // Simply load the alphabetical list
            allGames.value = sources;
            if (allGames.value.length > 0) {
                selectedGame.value = allGames.value[0];
            }
        };

        const filteredGames = computed(() => {
            const query = searchQuery.value.toLowerCase().trim();
            if (!query) return allGames.value;
            return allGames.value.filter(g => g.name.toLowerCase().includes(query));
        });

        const launchGame = (provider) => {
            if (!selectedGame.value) return;

            let url = "";
            const slug = selectedGame.value.slug;

            // Generate URL based on the button clicked
            if (provider === "CRAZY") {
                // Remove potential '0-' prefix if launching through CrazyGames
                const cleanSlug = slug.replace('0-', '');
                url = `https://www.crazygames.com/embed/${cleanSlug}`;
            } else if (provider === "COOLMATH") {
                url = `https://www.coolmathgames.com/${slug}/play`; // Do not add clean slug
            } else if (provider === "TWOPLAYER") {
                const cleanSlug = slug.replace('0-', '');
                url = `https://www.twoplayergames.org/embed/${cleanSlug}`;
            }

            const iframeHTML = `
            <style>
            body, html { margin: 0; padding: 0; height: 100vh; overflow: hidden; background: #000; }
            iframe { width: 100%; height: 100%; border: none; display: block; }
            </style>
            <iframe src="${url}"
            allow="autoplay; fullscreen; keyboard; gamepad"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
            </iframe>
            `;

            window.parent.postMessage({
                type: 'AVERO_OPEN_TAB',
                title: selectedGame.value.name,
                content: iframeHTML
            }, '*');
        };

        onMounted(initializeLibrary);

        return {
            allGames,
            filteredGames,
            selectedGame,
            searchQuery,
            launchGame
        };
    }
}).mount('#app');
