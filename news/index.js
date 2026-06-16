const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        // Active memory configurations
        const activeFeeds = ref({});
        const showMgmt = ref(false);
        const newFeedKey = ref('');
        const newFeedUrl = ref('');

        // App State
        const articles = ref([]);
        const loading = ref(false);
        const loadingContent = ref(false);
        const currentCat = ref('');

        // Reader Mode State
        const activeArticle = ref(null);
        const articleBody = ref("");

        // Initialize Feeds Matrix mapping static configurations vs local state allocations
        const loadInitialFeeds = () => {
            const saved = localStorage.getItem('avero_custom_feeds');
            if (saved) {
                try {
                    activeFeeds.value = JSON.parse(saved);
                } catch (e) {
                    activeFeeds.value = { ...feeds };
                }
            } else {
                // Base setup derived out of list.js fallback bounds
                activeFeeds.value = { ...feeds };
            }
            
            // Assign index fallback target key cleanly
            const keys = Object.keys(activeFeeds.value);
            if (keys.length > 0) {
                currentCat.value = keys[0];
            }
        };

        const saveFeedsState = () => {
            localStorage.setItem('avero_custom_feeds', JSON.stringify(activeFeeds.value));
        };

        // Fetch XML target array nodes
        const fetchNews = async (cat) => {
            if (!cat || !activeFeeds.value[cat]) return;
            currentCat.value = cat;
            loading.value = true;
            activeArticle.value = null;
            articles.value = [];

            const proxy = "https://corsproxy.io/?";
            try {
                const response = await fetch(proxy + encodeURIComponent(activeFeeds.value[cat]));
                const text = await response.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "application/xml");
                const items = xml.querySelectorAll("item");

                articles.value = Array.from(items).map(item => {
                    const titleNode = item.querySelector("title");
                    const linkNode = item.querySelector("link");
                    const sourceNode = item.querySelector("source");
                    
                    return {
                        title: titleNode ? titleNode.textContent : "Untitled Workspace Node",
                        link: linkNode ? linkNode.textContent : "#",
                        source: sourceNode ? sourceNode.textContent : cat.toUpperCase(),
                        description: "Click to stream object content metrics through native frame layout map..."
                    };
                });
            } catch (e) {
                console.error("RSS Fetch failed", e);
            } finally {
                loading.value = false;
            }
        };

        // Manage Custom Items
        const addCustomFeed = () => {
            const key = newFeedKey.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const url = newFeedUrl.value.trim();

            if (!key || !url) {
                alert("Provide validation parameters for unique ID mapping constraints.");
                return;
            }

            activeFeeds.value[key] = url;
            saveFeedsState();
            
            newFeedKey.value = '';
            newFeedUrl.value = '';
            fetchNews(key);
        };

        const deleteFeed = (cat) => {
            if (confirm(`Purge subscription registry mapping for sequence entry: "${cat}"?`)) {
                delete activeFeeds.value[cat];
                saveFeedsState();
                
                const remaining = Object.keys(activeFeeds.value);
                if (currentCat.value === cat && remaining.length > 0) {
                    fetchNews(remaining[0]);
                } else if (remaining.length === 0) {
                    articles.value = [];
                }
            }
        };

        const isCustomFeed = (cat) => {
            // Evaluates whether it's structural text or matching background initialization frames
            return !feeds.hasOwnProperty(cat);
        };

        // File Operations: Export dynamic const structural configuration map
        const exportFeedsFile = () => {
            const dataStructure = `const feeds = ${JSON.stringify(activeFeeds.value, null, 4)};`;
            const blob = new Blob([dataStructure], { type: 'application/javascript;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "list.js");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // File Operations: Parse customized script payloads
        const importFeedsFile = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const rawText = e.target.result;
                try {
                    // Strips structural declarations and attempts standard extraction logic cleanly
                    const jsonString = rawText.replace(/const\s+feeds\s*=\s*/, '').replace(/;$/, '').trim();
                    const parsed = JSON.parse(jsonString);
                    
                    if (parsed && typeof parsed === 'object') {
                        activeFeeds.value = parsed;
                        saveFeedsState();
                        const firstKey = Object.keys(parsed)[0];
                        if (firstKey) fetchNews(firstKey);
                        alert("Structural data arrays successfully written to index storage gateways.");
                    }
                } catch (err) {
                    alert("Failure loading external configurations: Structural syntax must closely follow raw 'const feeds = { ... }' templates.");
                }
            };
            reader.readAsText(file);
        };

        // Article Scraping Layouts
        const openArticle = async (article) => {
            activeArticle.value = article;
            articleBody.value = "Streaming source documents across buffer lanes...";
            loadingContent.value = true;

            const proxy = "https://corsproxy.io/?";
            try {
                const response = await fetch(proxy + encodeURIComponent(article.link));
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");

                const content = doc.querySelector("article") ||
                                doc.querySelector("main") ||
                                doc.querySelector(".article-body") ||
                                doc.body;

                const junk = content.querySelectorAll("script, iframe, nav, footer, style, header, .ads");
                junk.forEach(el => el.remove());

                articleBody.value = content.innerHTML;
            } catch (e) {
                articleBody.value = "Could not stream clean reading metrics. Connection interface locked down by target host parameters.";
            } finally {
                loadingContent.value = false;
            }
        };

        // Bootstrap Core Configurations
        loadInitialFeeds();
        if (currentCat.value) {
            fetchNews(currentCat.value);
        }

        return {
            articles,
            loading,
            currentCat,
            categories: computed(() => Object.keys(activeFeeds.value)),
            fetchNews,
            openArticle,
            activeArticle,
            articleBody,
            loadingContent,
            
            // New Custom Systems Exposed Nodes
            showMgmt,
            newFeedKey,
            newFeedUrl,
            addCustomFeed,
            deleteFeed,
            isCustomFeed,
            exportFeedsFile,
            importFeedsFile
        };
    }
}).mount('#app');
