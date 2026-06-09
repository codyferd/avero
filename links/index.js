const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        const search = ref("");
        const isSidebarOpen = ref(false);
        
        // Active category routing controller ('apps' or 'games')
        const currentCategory = ref("apps");

        // Reactively pull globally declared structures from list.js
        const apps = ref(typeof appsList !== 'undefined' ? appsList : []);
        const games = ref(typeof gamesList !== 'undefined' ? gamesList : []);

        // Compute alphabetically filtered items tracking the active category matrix
        const filteredItems = computed(() => {
            const currentSource = currentCategory.value === 'apps' ? apps.value : games.value;
            let sorted = [...currentSource].sort((a, b) => a.name.localeCompare(b.name));

            if (!search.value) return sorted;
            return sorted.filter(item => item.name.toLowerCase().includes(search.value.toLowerCase()));
        });

        // Handler to route destinations safely based on iframe-blocking properties
        const launchLink = (item, targetMode) => {
            if (targetMode === 'external') {
                window.open(item.url, '_blank', 'noopener,noreferrer');
                return;
            }

            // Fallback: Post messaging payload up to the core Avero runtime panel instance
            const iframeHTML = `
            <body style="margin:0;background:#000;overflow:hidden">
            <iframe src="${item.url}" style="width:100vw;height:100vh;border:none;" allow="autoplay; fullscreen; gamepad"></iframe>
            </body>
            `;

            window.parent.postMessage({
                type: 'AVERO_OPEN_TAB',
                title: item.name,
                content: iframeHTML
            }, '*');
        };

        return { 
            search, 
            isSidebarOpen, 
            currentCategory, 
            filteredItems, 
            launchLink 
        };
    }
}).mount('#app');