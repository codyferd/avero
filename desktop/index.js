const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const isLoading = ref(true);
        const currentTime = ref('');
        const currentDate = ref('');

        // 3-Layer UI State: 0 = hidden, 1 = taskbar, 2 = full
        const uiLevel = ref(0);

        const isSearchOpen = ref(false);
        const isSplitMenuOpen = ref(false);
        const urlInput = ref('');
        const bgUrl = ref("background.avif");
        const desktops = ref([]);
        const activeDesktopId = ref(null);
        const focusedAppId = ref(null);

        // Drag and Drop Tab Tracking State nodes
        const draggedTabIndex = ref(null);
        const dragOverTabIndex = ref(null);

        const otherDesktops = computed(() =>
        desktops.value.filter(d => d.id !== activeDesktopId.value)
        );

        // Tab Drag and Drop Event Handlers
        const handleTabDragStart = (event, index) => {
            draggedTabIndex.value = index;
            event.dataTransfer.effectAllowed = "move";
        };

        const handleTabDragOver = (event, index) => {
            if (draggedTabIndex.value !== index) {
                dragOverTabIndex.value = index;
            }
        };

        const handleTabDragLeave = (event) => {
            // Clear hover active layouts if cursor wanders outside item boundary
            dragOverTabIndex.value = null;
        };

        const handleTabDrop = (event, targetIndex) => {
            const sourceIndex = draggedTabIndex.value;
            dragOverTabIndex.value = null;
            draggedTabIndex.value = null;

            if (sourceIndex === null || sourceIndex === targetIndex) return;

            // Reorder the core responsive desktops list array directly
            const movedItem = desktops.value.splice(sourceIndex, 1)[0];
            desktops.value.splice(targetIndex, 0, movedItem);
        };

        // Core UI Logic
        const cycleUI = () => {
            uiLevel.value = (uiLevel.value + 1) % 3;
        };

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
                splitRatio: 50, // Added initialization state baseline
                apps: [{ ...app, instanceId: id }]
            });
            activeDesktopId.value = id;
            focusedAppId.value = id;

            // Auto-collapse to Level 1 (Taskbar) after launching
            uiLevel.value = 1;
        };

        const launchUrl = () => {
            let query = urlInput.value.trim();
            if (!query) return;

            let finalUrl = query.includes('.') && !query.includes(' ')
            ? (query.startsWith('http') ? query : `https://${query}`)
            : `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;

            let siteName = 'Web';
            try {
                const urlObj = new URL(finalUrl);
                const hostParts = urlObj.hostname.replace('www.', '').split('.');
                if (hostParts.length > 0) {
                    siteName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
                }
            } catch (e) {
                siteName = 'Web';
            }

            const id = Date.now();
            desktops.value.push({
                id,
                name: siteName,
                splitRatio: 50, // Added initialization state baseline
                apps: [{ title: 'Browser', icon: '🌐', path: finalUrl, instanceId: id }]
            });

            activeDesktopId.value = id;
            focusedAppId.value = id;
            urlInput.value = "";
            isSearchOpen.value = false;

            // Auto-collapse to Level 1 (Taskbar) after launching
            uiLevel.value = 1;
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
                    target.splitRatio = 50; // Dynamic baseline configuration layout split tracking
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
            if (action === 'reload') frame.src = frame.src;
        };

        // Gutter resizer controller interaction engine loop
        const startTileResize = (mouseDownEvent, desktopTarget) => {
            mouseDownEvent.preventDefault();

            const gridContainer = mouseDownEvent.target.parentElement;
            gridContainer.classList.add('desktop-grid-resizing');

            const startX = mouseDownEvent.clientX;
            const containerWidth = gridContainer.clientWidth;
            const initialRatio = desktopTarget.splitRatio || 50;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaPercentage = (deltaX / containerWidth) * 100;

                let newPercentage = initialRatio + deltaPercentage;
                if (newPercentage < 15) newPercentage = 15;
                if (newPercentage > 85) newPercentage = 85;

                desktopTarget.splitRatio = Math.round(newPercentage);
            };

            const onMouseUp = () => {
                gridContainer.classList.remove('desktop-grid-resizing');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        const updateClock = () => {
            const now = new Date();
            currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            currentDate.value = now.toISOString().split('T')[0];
        };

        onMounted(() => {
            updateClock();
            setInterval(updateClock, 1000);
            setTimeout(() => { isLoading.value = false; }, 800);

            window.addEventListener('message', (event) => {
                if (event.data.type === 'AVERO_OPEN_TAB') {
                    const { title, content } = event.data;
                    const blob = new Blob([content], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);

                    const id = Date.now();
                    desktops.value.push({
                        id,
                        name: title || 'Live Preview',
                        splitRatio: 50,
                        apps: [{
                            title: title || 'Live Preview',
                            icon: '⚡',
                            path: blobUrl,
                            instanceId: id
                        }]
                    });
                    activeDesktopId.value = id;
                    focusedAppId.value = id;
                    uiLevel.value = 1; // Show taskbar to reveal the new tab
                }
            });
        });

        return {
            isLoading, appList, desktops, activeDesktopId,
            uiLevel, isSearchOpen, isSplitMenuOpen, otherDesktops, urlInput,
            currentTime, currentDate, bgUrl, focusedAppId,
            dragOverTabIndex, // Expose interactive styling reference node
            launchNewDesktop, launchUrl, closeDesktop, closeApp, mergeTabs, navAction,
            smartClose, smartRefresh, cycleUI, startTileResize,
            handleTabDragStart, handleTabDragOver, handleTabDragLeave, handleTabDrop
        };
    }
}).mount('#app');
