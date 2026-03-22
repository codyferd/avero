const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const isLoading = ref(true);
        const currentTime = ref('');
        const currentDate = ref('');
        const isDrawerOpen = ref(false);
        const urlInput = ref('');
        const proxyInput = ref('');
        const proxyIndex = ref(0);
        const desktops = ref([]);
        const activeDesktopId = ref(null);
        const bgUrl = ref("background.avif");

        const draggedTabId = ref(null);
        const dragOverId = ref(null);

        const appList = [
            { id: 0, title: 'About', icon: '👤', path: '../../app/about/index.html' },
            { id: 1, title: 'Calculator', icon: '🔢', path: '../../app/calculator/index.html' },
            { id: 2, title: 'Chess', icon: '♟️', path: '../../app/chess/index.html' },
            { id: 3, title: 'Clicker', icon: '🖱️', path: '../../app/clicker/index.html' },
            { id: 4, title: 'Files', icon: '📂', path: '../../app/files/index.html' },
            { id: 5, title: 'HTML', icon: '</>', path: '../../app/html/index.html' },
            { id: 6, title: 'Player', icon: '🎬', path: '../../app/player/index.html' },
            { id: 7, title: 'Stopwatch', icon: '⌚', path: '../../app/stopwatch/index.html'},
            { id: 8, title: 'Superbirdjumper3', icon: '🐦', path: '../../app/superbirdjumper3/index.html' },
            { id: 9, title: 'Terminal', icon: '📦', path: '../../app/terminal/index.html'},
            { id: 10, title: 'Tictactoe', icon: '🌀', path: '../../app/tictactoe/index.html'},
            { id: 11, title: 'Ultraraccoon', icon: '🦝', path: '../../app/ultraraccoon/index.html'},
        ];

        const handleSystemMessages = (event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;

            if (msg.type === 'AVERO_OPEN_TAB') {
                const id = Date.now();
                const blob = new Blob([msg.content], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                desktops.value.push({
                    id,
                    name: msg.title || 'Live Tab',
                    apps: [{ title: msg.title || 'Preview', icon: '📄', path: blobUrl, instanceId: id }]
                });
                activeDesktopId.value = id;
            }
            if (msg.type === 'AVERO_SET_WALLPAPER') {
                bgUrl.value = msg.url;
            }
        };

        const mergeTabs = (targetId) => {
            if (draggedTabId.value === targetId) return;
            const sourceIdx = desktops.value.findIndex(d => d.id === draggedTabId.value);
            const targetIdx = desktops.value.findIndex(d => d.id === targetId);

            if (sourceIdx !== -1 && targetIdx !== -1) {
                const sourceDesktop = desktops.value[sourceIdx];
                const targetDesktop = desktops.value[targetIdx];
                if (targetDesktop.apps.length + sourceDesktop.apps.length <= 4) {
                    targetDesktop.apps.push(...sourceDesktop.apps);
                    targetDesktop.name = "Split View";
                    desktops.value.splice(sourceIdx, 1);
                    activeDesktopId.value = targetId;
                }
            }
            dragOverId.value = null;
            draggedTabId.value = null;
        };

        const launchUrl = () => {
            let query = urlInput.value.trim();
            if (!query) return;
            let finalUrl = query.includes('.') && !query.includes(' ') ? (query.startsWith('http') ? query : `https://${query}`) : `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
            const id = Date.now();
            desktops.value.push({ id, name: 'Web', apps: [{ title: 'Browser', icon: '🌐', path: finalUrl, instanceId: id }] });
            activeDesktopId.value = id;
            urlInput.value = "";
            isDrawerOpen.value = false;
        };

        const launchProxyUrl = () => {
            let query = proxyInput.value.trim();
            if (!query) return;

            const proxyList = window.proxies || ["https://www.google.com/search?q="];
            const currentProxy = proxyList[proxyIndex.value % proxyList.length];
            const finalUrl = `${currentProxy}${encodeURIComponent(query)}`;

            const id = Date.now();
            desktops.value.push({
                id,
                name: 'Proxy Web',
                apps: [{ title: 'Proxy Browser', icon: '🛡️', path: finalUrl, instanceId: id }]
            });

            activeDesktopId.value = id;
            proxyIndex.value++;
            isDrawerOpen.value = false;
        };

        const launchNewDesktop = (app) => {
            const id = Date.now();
            desktops.value.push({ id, name: app.title, apps: [{ ...app, instanceId: id }] });
            activeDesktopId.value = id;
            isDrawerOpen.value = false;
        };

        const activeDesktop = computed(() => desktops.value.find(d => d.id === activeDesktopId.value));

        const closeApp = (instanceId) => {
            activeDesktop.value.apps = activeDesktop.value.apps.filter(a => a.instanceId !== instanceId);
            if (activeDesktop.value.apps.length === 0) closeDesktop(activeDesktop.value.id);
        };

            const closeDesktop = (id) => {
                desktops.value = desktops.value.filter(d => d.id !== id);
                if (activeDesktopId.value === id) activeDesktopId.value = desktops.value.length ? desktops.value[0].id : null;
            };

                const navAction = (id, action) => {
                    const frame = document.getElementById('frame-' + id);
                    if (!frame) return;
                    try {
                        if (action === 'reload') frame.src = frame.src;
                        if (action === 'back') frame.contentWindow.history.back();
                        if (action === 'forward') frame.contentWindow.history.forward();
                    } catch (e) {}
                };

                const updateClock = () => {
                    const now = new Date();
                    currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    currentDate.value = now.toISOString().split('T')[0];
                };

                onMounted(() => {
                    updateClock();
                    setInterval(updateClock, 1000);
                    window.addEventListener('message', handleSystemMessages);
                    setTimeout(() => { isLoading.value = false; }, 800);
                });

                return {
                    isLoading, appList, desktops, activeDesktopId, activeDesktop, isDrawerOpen,
          launchNewDesktop, urlInput, proxyInput, currentTime, currentDate, launchUrl, launchProxyUrl,
          closeDesktop, closeApp, navAction, draggedTabId, dragOverId, mergeTabs,
          bgUrl
                };
    }
}).mount('#app');
