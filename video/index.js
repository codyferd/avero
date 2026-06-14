const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // UI Layout & Theme Configuration
        const isDarkTheme = ref(true); 
        
        // Data Pipeline Core
        const searchQuery = ref('');
        const loading = ref(false);
        const results = ref([]);
        const activeTrack = ref(null);
        
        // Channel Sub-Context Discovery Variables
        const activeChannelId = ref('');
        const activeChannelName = ref('');

        // Comment Pipeline Context
        const comments = ref([]);
        const commentsLoading = ref(false);

        // Native Hardware & Framework Iframe Player Controllers
        let videoPlayerInstance = null;
        let youtubeApiReady = false;

        const invidiousInstances = [
            'https://invidious.flokinet.to',
            'https://yewtu.be',
            'https://invidious.nerdvpn.de',
            'https://vid.puffyan.us'
        ];
        const activeApiUrl = ref(invidiousInstances[0]);

        onMounted(async () => {
            applyThemeContext();
            await initializeApiCluster();
            
            if (window.YT && window.YT.Player) {
                youtubeApiReady = true;
                bootYoutubePlayerEngines();
            } else {
                window.onYouTubeIframeAPIReady = () => {
                    youtubeApiReady = true;
                    bootYoutubePlayerEngines();
                };
            }

            executeSearch();
        });

        const applyThemeContext = () => {
            const el = document.documentElement;
            if (isDarkTheme.value) {
                el.style.setProperty('--bg-primary', '#000000');
                el.style.setProperty('--bg-secondary', '#0a0a0a');
                el.style.setProperty('--text-main', '#ffffff');
                el.classList.add('pitch-black');
            }
        };

        const initializeApiCluster = async () => {
            for (let baseUrl of invidiousInstances) {
                try {
                    const check = await fetch(`${baseUrl}/api/v1/trending`, { 
                        method: 'GET',
                        signal: AbortSignal.timeout(1500) 
                    });
                    if (check.ok) {
                        activeApiUrl.value = baseUrl;
                        return;
                    }
                } catch (e) {
                    // Fail silently
                }
            }
        };

        const bootYoutubePlayerEngines = () => {
            try {
                videoPlayerInstance = new YT.Player('avero-iframe-player-target', {
                    height: '100%',
                    width: '100%',
                    videoId: '',
                    playerVars: { 
                        'autoplay': 1, 
                        'playsinline': 1, 
                        'rel': 0, 
                        'modestbranding': 1, 
                        'origin': window.location.origin 
                    }
                });
            } catch(e) {}
        };

        const executeSearch = async () => {
            loading.value = true;
            activeChannelId.value = ''; 
            const query = searchQuery.value.trim();
            
            let endpoint = `${activeApiUrl.value}/api/v1/trending`;
            if (query) {
                endpoint = `${activeApiUrl.value}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
            }

            await parseInvidiousPayload(endpoint);
            
            // Scroll down to main matrix if search executed on mobile views
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        };

        const viewChannel = async (channelId, channelName) => {
            if (!channelId) return;
            loading.value = true;
            activeChannelId.value = channelId;
            activeChannelName.value = channelName || 'Channel';
            searchQuery.value = '';

            const endpoint = `${activeApiUrl.value}/api/v1/channels/${channelId}/videos`;
            await parseInvidiousPayload(endpoint);
        };

        const resetToHome = () => {
            searchQuery.value = '';
            activeChannelId.value = '';
            activeChannelName.value = '';
            executeSearch();
        };

        const parseInvidiousPayload = async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error();
                const data = await response.json();
                const sourceItems = Array.isArray(data) ? data : (data.items || data.videos || data);
                
                results.value = sourceItems.map(item => ({
                    id: item.videoId || item.id,
                    title: item.title,
                    author: item.author,
                    authorId: item.authorId,
                    duration: item.lengthSeconds,
                    thumbnail: item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${item.videoId || item.id}/hqdefault.jpg`
                }));
            } catch (err) {
                results.value = [];
            } finally {
                loading.value = false;
            }
        };

        const selectMedia = (item) => {
            activeTrack.value = item;
            const targetId = item.id;
            if (!targetId) return;

            if (videoPlayerInstance && videoPlayerInstance.loadVideoById) {
                videoPlayerInstance.loadVideoById(targetId);
            }

            fetchTrackComments(targetId);

            // Force mobile view layouts to scroll smoothly upwards to focus the screen viewport
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        const triggerDownload = (item) => {
            if (!item || !item.id) return;
            const conversionUrl = `https://cutyt.com/https://www.youtube.com/watch?v=${item.id}`;
            window.open(conversionUrl, '_blank');
        };

        const openExternalYoutube = (videoId) => {
            if (!videoId) return;
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        };

        // FIXED: Multi-layer cross-origin Picture-in-Picture execution strategy
        const triggerPictureInPicture = async () => {
            try {
                // Step 1: Attempt to safely target the underlying HTML5 iframe container element node
                let targetElement = document.getElementById('avero-iframe-player-target');
                
                if (videoPlayerInstance && typeof videoPlayerInstance.getIframe === 'function') {
                    const dynamicNode = videoPlayerInstance.getIframe();
                    if (dynamicNode) targetElement = dynamicNode;
                }

                // Step 2: Check if browser sandbox permits direct element invocation layers
                if (targetElement && document.pictureInPictureEnabled) {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                        return;
                    }
                    
                    if (targetElement.requestPictureInPicture) {
                        await targetElement.requestPictureInPicture();
                        return;
                    }
                }

                // Step 3: Mobile/Tablet Safari & Chrome fallback proxy workaround mechanism
                // Safely intercepts elements inside document view boundaries to toggle device pip context menus
                const nativeFallbackVideo = targetElement?.querySelector('video') || document.querySelector('video');
                if (nativeFallbackVideo) {
                    if (nativeFallbackVideo.webkitSupportsPresentationMode && typeof nativeFallbackVideo.webkitSetPresentationMode === 'function') {
                        const currentMode = nativeFallbackVideo.webkitPresentationMode;
                        nativeFallbackVideo.webkitSetPresentationMode(currentMode === "picture-in-picture" ? "inline" : "picture-in-picture");
                    } else if (nativeFallbackVideo.requestPictureInPicture) {
                        await nativeFallbackVideo.requestPictureInPicture();
                    }
                } else {
                    // Safe fall-back action: Open directly in secondary clean background listening tab if hard-restricted
                    window.open(`https://www.youtube.com/embed/${activeTrack.value.id}?autoplay=1`, '_blank');
                }
            } catch (e) {
                // If browser sandbox fully prevents script execution, open cleanly in external target context
                if (activeTrack.value?.id) {
                    window.open(`https://www.youtube.com/embed/${activeTrack.value.id}?autoplay=1`, '_blank');
                }
            }
        };

        const fetchTrackComments = async (videoId) => {
            commentsLoading.value = true;
            comments.value = [];
            try {
                const res = await fetch(`${activeApiUrl.value}/api/v1/comments/${videoId}`);
                if (res.ok) {
                    const data = await res.json();
                    comments.value = data.comments || [];
                }
            } catch (e) {
                comments.value = [];
            } finally {
                commentsLoading.value = false;
            }
        };

        const formatDuration = (seconds) => {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        return {
            searchQuery, loading, results, activeTrack,
            activeChannelId, activeChannelName, comments, commentsLoading,
            executeSearch, viewChannel, resetToHome, selectMedia, triggerDownload, openExternalYoutube, triggerPictureInPicture, formatDuration
        };
    }
}).mount('#app');
