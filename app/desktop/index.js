const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const isLoading = ref(true);
        const currentTime = ref('');
        const currentDate = ref('');
        const isDrawerOpen = ref(false);
        const isSearchOpen = ref(false); // Added for the new sub-bar dropdown
        const isSplitMenuOpen = ref(false);
        const urlInput = ref('');
        const bgUrl = ref("background.avif");
        const desktops = ref([]);
        const activeDesktopId = ref(null);
        const focusedAppId = ref(null);

        const otherDesktops = computed(() =>
        desktops.value.filter(d => d.id !== activeDesktopId.value)
        );

        const smartClose = () => {
            if (focusedAppId.value && activeDesktopId.value) {
                closeApp(focusedAppId.value, activeDesktopId.value);
            } else if (activeDesktopId.value) {
                closeDesktop(activeDesktopId.value);
            }
        };

        const smartRefresh = () => {
            if (focusedAppId.value) {
                navAction(focusedAppId.value, 'reload');
            } else if (activeDesktopId.value) {
                const d = desktops.value.find(x => x.id === activeDesktopId.value);
                if (d) d.apps.forEach(a => navAction(a.instanceId, 'reload'));
            }
        };

        const launchNewDesktop = (app) => {
            const id = Date.now();
            desktops.value.push({
                id,
                name: app.title,
                apps: [{ ...app, instanceId: id }]
            });
            activeDesktopId.value = id;
            focusedAppId.value = id;
            isDrawerOpen.value = false;
        };

        const launchUrl = () => {
            let query = urlInput.value.trim();
            if (!query) return;

            let finalUrl = query.includes('.') && !query.includes(' ')
            ? (query.startsWith('http') ? query : `https://${query}`)
            : `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;

            // --- Dynamic Name Logic Start ---
            let siteName = 'Web'; // Default fallback

            try {
                const urlObj = new URL(finalUrl);
                const hostParts = urlObj.hostname.replace('www.', '').split('.');

                if (hostParts.length > 0) {
                    // Capitalize the first part (e.g., 'google', 'cern', 'github')
                    siteName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
                }
            } catch (e) {
                // Fallback to 'Web' if URL parsing fails (e.g., weird search queries)
                siteName = 'Web';
            }
            // --- Dynamic Name Logic End ---

            const id = Date.now();
            desktops.value.push({
                id,
                name: siteName, // Uses the dynamic name here
                apps: [{ title: 'Browser', icon: '🌐', path: finalUrl, instanceId: id }]
            });

            activeDesktopId.value = id;
            focusedAppId.value = id;
            urlInput.value = "";
            isSearchOpen.value = false;
            isDrawerOpen.value = false;
        };


        const mergeTabs = (sourceId, targetId) => {
            const sIdx = desktops.value.findIndex(d => d.id === sourceId);
            const tIdx = desktops.value.findIndex(d => d.id === targetId);

            if (sIdx !== -1 && tIdx !== -1) {
                const source = desktops.value[sIdx];
                const target = desktops.value[tIdx];

                if (target.apps.length + source.apps.length <= 4) {
                    target.apps.push(...source.apps);
                    target.name = "Split View";
                    desktops.value.splice(sIdx, 1);
                    activeDesktopId.value = targetId;
                    focusedAppId.value = null;
                }
            }
            isSplitMenuOpen.value = false;
        };

        const closeApp = (instanceId, desktopId) => {
            const desktop = desktops.value.find(d => d.id === desktopId);
            if (!desktop) return;
            desktop.apps = desktop.apps.filter(a => a.instanceId !== instanceId);
            if (focusedAppId.value === instanceId) focusedAppId.value = null;
            if (desktop.apps.length === 0) closeDesktop(desktopId);
        };

            const closeDesktop = (id) => {
                desktops.value = desktops.value.filter(d => d.id !== id);
                if (activeDesktopId.value === id) {
                    activeDesktopId.value = desktops.value.length ? desktops.value[0].id : null;
                }
            };

            const navAction = (id, action) => {
                const frame = document.getElementById('frame-' + id);
                if (!frame) return;
                try {
                    if (action === 'reload') frame.src = frame.src;
                } catch (e) {
                    if (action === 'reload') {
                        const currentSrc = frame.src;
                        frame.src = '';
                        frame.src = currentSrc;
                    }
                }
            };

            const updateClock = () => {
                const now = new Date();
                currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                currentDate.value = now.toISOString().split('T')[0];
            };

            onMounted(() => {
                updateClock();
                setInterval(updateClock, 1000);
                setTimeout(() => { isLoading.value = false; });

                window.addEventListener('message', (event) => {
                    if (event.data.type === 'AVERO_OPEN_TAB') {
                        const { title, content } = event.data;
                        const blob = new Blob([content], { type: 'text/html' });
                        const blobUrl = URL.createObjectURL(blob);

                        const id = Date.now();
                        desktops.value.push({
                            id,
                            name: title || 'Live Preview',
                            apps: [{
                                title: title || 'Live Preview',
                                icon: '⚡',
                                path: blobUrl,
                                instanceId: id
                            }]
                        });
                        activeDesktopId.value = id;
                        focusedAppId.value = id;
                    }
                });
            });

            return {
                isLoading, appList, desktops, activeDesktopId,
          isDrawerOpen, isSearchOpen, isSplitMenuOpen, otherDesktops, urlInput,
          currentTime, currentDate, bgUrl, focusedAppId,
          launchNewDesktop, launchUrl, closeDesktop, closeApp, mergeTabs, navAction,
          smartClose, smartRefresh
            };
    }
}).mount('#app');
