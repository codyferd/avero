const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        const search = ref("");
        const isSidebarOpen = ref(false);
        // gamesList is globally available from list.js
        const games = ref(gamesList);

        const filteredGames = computed(() => {
            // Sort Alphabetically
            let sorted = [...games.value].sort((a, b) => a.name.localeCompare(b.name));

            // Filter by search
            if (!search.value) return sorted;
            return sorted.filter(g => g.name.toLowerCase().includes(search.value.toLowerCase()));
        });

        const openGame = (game) => {
            // Native Avero Tab Message
            const iframeHTML = `
            <body style="margin:0;background:#000;overflow:hidden">
            <iframe src="${game.url}" style="width:100vw;height:100vh;border:none;" allow="autoplay; fullscreen; gamepad"></iframe>
            </body>
            `;

            window.parent.postMessage({
                type: 'AVERO_OPEN_TAB',
                title: game.name,
                content: iframeHTML
            }, '*');
        };

        return { search, isSidebarOpen, filteredGames, openGame };
    }
}).mount('#app');

