const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const isLoading = ref(true);
        const currentTime = ref('');
        const currentDate = ref('');
        const versionNumber = ref('Unknown'); // Fallback default text
        const searchQuery = ref('');

        // Sidebar Dashboard Panel visibility state node 
        const isSidebarOpen = ref(false);
        const isSplitMenuOpen = ref(false);
        
        const bgUrl = ref("background.avif");
        const desktops = ref([]);
        const activeDesktopId = ref(null);
        const focusedAppId = ref(null);

        // Drag and Drop Tab Tracking State nodes
        const draggedTabIndex = ref(null);
        const dragOverTabIndex = ref(null);

        // Computed Alphabetical Arrangement sorting matching user structural parameters
        const sortedAppList = computed(() => {
            // Check window context or global scope explicitly
            const apps = window.appList || (typeof appList !== 'undefined' ? appList : null);
            if (!apps) return [];
            return [...apps].sort((a, b) => a.title.localeCompare(b.title));
        });

        const otherDesktops = computed(() =>
            desktops.value.filter(d => d.id !== activeDesktopId.value)
        );

        // Sidebar Open/Close Toggle Action 
        const toggleSidebar = () => {
            isSidebarOpen.value = !isSidebarOpen.value;
        };

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
            dragOverTabIndex.value = null;
        };

        const handleTabDrop = (event, targetIndex) => {
            const sourceIndex = draggedTabIndex.value;
            dragOverTabIndex.value = null;
            draggedTabIndex.value = null;

            if (sourceIndex === null || sourceIndex === targetIndex) return;

            const movedItem = desktops.value.splice(sourceIndex, 1)[0];
            desktops.value.splice(targetIndex, 0, movedItem);
        };

        const toggleSplitView = () => {
            isSplitMenuOpen.value = !isSplitMenuOpen.value;
        };

        // Target split menu specifically relative to the requested active tab instance
        const toggleSplitViewTab = (desktopId) => {
            activeDesktopId.value = desktopId;
            isSplitMenuOpen.value = !isSplitMenuOpen.value;
        };

        const smartClose = () => {
            if (focusedAppId.value && activeDesktopId.value) {
                closeApp(focusedAppId.value, activeDesktopId.value);
            } else if (activeDesktopId.value) {
                closeDesktop(activeDesktopId.value);
            }
        };

        const closeTabDirect = (desktopId) => {
            closeDesktop(desktopId);
        };

        const smartRefresh = () => {
            if (focusedAppId.value) {
                navAction(focusedAppId.value, 'reload');
            } else if (activeDesktopId.value) {
                const d = desktops.value.find(x => x.id === activeDesktopId.value);
                if (d) d.apps.forEach(a => navAction(a.instanceId, 'reload'));
            }
        };

        // Tab-specific targeted refresh execution
        const smartRefreshTab = (desktopInstance) => {
            if (desktopInstance && desktopInstance.apps) {
                desktopInstance.apps.forEach(a => navAction(a.instanceId, 'reload'));
            }
        };

        const launchNewDesktop = (app) => {
            const id = Date.now();
            desktops.value.push({
                id,
                name: app.title,
                splitRatio: 50,
                apps: [{ ...app, instanceId: id }]
            });
            activeDesktopId.value = id;
            focusedAppId.value = id;
            
            // Auto close drawer workspace selector on application boot context load
            isSidebarOpen.value = false;
        };

        // Intelligent omni-search navigation logic processor
        const handleSearchSubmit = () => {
    const query = searchQuery.value.trim();
    if (!query) return;

    // 1. If it doesn't include a dot, try to launch a local Avero app or fallback to search
    if (!query.includes('.')) {
        // Look through your sorted application list for a match (case-insensitive)
        const localAppMatch = sortedAppList.value.find(
            app => app.title.toLowerCase() === query.toLowerCase()
        );

        if (localAppMatch) {
            // Found a local application -> Launch it natively inside Avero
            launchNewDesktop(localAppMatch);
            searchQuery.value = '';
            return;
        } else {
            // Local app not found -> Treat as a search string query and fallback to the web tab engine
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            const id = Date.now();
            
            desktops.value.push({
                id,
                name: `Search: ${query}`,
                splitRatio: 50,
                apps: [{
                    title: `Search: ${query}`,
                    icon: '🌐',
                    path: searchUrl,
                    instanceId: id
                }]
            });

            activeDesktopId.value = id;
            focusedAppId.value = id;
            searchQuery.value = '';
            isSidebarOpen.value = false;
            return;
        }
    }

    // 2. Original web navigation path (if it includes a dot)
    let targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
    let targetTitle = query;

    try {
        const parsed = new URL(targetUrl);
        targetTitle = parsed.hostname.replace('www.', '');
    } catch(e) {
        targetTitle = 'Web Browser';
    }

    const id = Date.now();
    desktops.value.push({
        id,
        name: targetTitle,
        splitRatio: 50,
        apps: [{
            title: targetTitle,
            icon: '🌐',
            path: targetUrl,
            instanceId: id
        }]
    });

    activeDesktopId.value = id;
    focusedAppId.value = id;
    searchQuery.value = '';
    isSidebarOpen.value = false;
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
                    target.splitRatio = 50; 
                    desktops.value.splice(sIdx, 1);
                    activeDesktopId.value = targetId;
                    focusedAppId.value = null;
                }
            }
            isSplitMenuOpen.value = false;
            isSidebarOpen.value = false;
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

        // Reads README file content and grabs only line 1
        const fetchVersionNumber = async () => {
            try {
                const response = await fetch('../README.md');
                if (response.ok) {
                    const text = await response.text();
                    const firstLine = text.split(/\r?\n/)[0];
                    if (firstLine.trim()) {
                        versionNumber.value = firstLine.trim();
                    }
                }
            } catch (error) {
                console.error("Failed to fetch version tag descriptor from README context:", error);
            }
        };

        onMounted(() => {
            updateClock();
            fetchVersionNumber();
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
                }
            });
        });

        return {
            isLoading, desktops, activeDesktopId,
            isSidebarOpen, isSplitMenuOpen, otherDesktops,
            currentTime, currentDate, bgUrl, focusedAppId,
            dragOverTabIndex, sortedAppList, versionNumber, searchQuery,
            launchNewDesktop, closeDesktop, closeApp, mergeTabs, navAction,
            smartClose, smartRefresh, smartRefreshTab, startTileResize, toggleSidebar, 
            toggleSplitView, toggleSplitViewTab, closeTabDirect, handleSearchSubmit,
            handleTabDragStart, handleTabDragOver, handleTabDragLeave, handleTabDrop
        };
    }
}).mount('#app');
