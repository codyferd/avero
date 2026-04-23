const { createApp, ref } = Vue;

createApp({
    setup() {
        // App State
        const articles = ref([]);
        const loading = ref(false);
        const loadingContent = ref(false); // Specifically for loading the reader view
        const currentCat = ref('itsfoss');

        // Reader Mode State
        const activeArticle = ref(null);
        const articleBody = ref("");

        // RSS Feed Configuration
        const feeds = {
            itsfoss: "https://feed.itsfoss.com",
            bbc: "https://feeds.bbci.co.uk/news/rss.xml",
            allafrica: "https://allafrica.com/tools/headlines/rdf/africa/headlines.rdf",
            abc: "https://abcnews.com/abcnews/internationalheadlines",
            nypost: "https://nypost.com/feed/",
            hkfp: "https://hongkongfp.com/feed/",
        };

        // 1. Fetch the RSS Feed List
        const fetchNews = async (cat = 'itsfoss') => {
            currentCat.value = cat;
            loading.value = true;
            activeArticle.value = null; // Reset reader mode
            articles.value = [];

            const proxy = "https://corsproxy.io/?";
            try {
                const response = await fetch(proxy + encodeURIComponent(feeds[cat]));
                const text = await response.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "application/xml");
                const items = xml.querySelectorAll("item");

                articles.value = Array.from(items).map(item => ({
                    title: item.querySelector("title").textContent,
                                                                link: item.querySelector("link").textContent,
                                                                source: item.querySelector("source")?.textContent || "Google News",
                                                                description: "Click to read full article..."
                }));
            } catch (e) {
                console.error("RSS Fetch failed", e);
            } finally {
                loading.value = false;
            }
        };

        // 2. Fetch and Parse Article (Reader Mode)
        const openArticle = async (article) => {
            activeArticle.value = article;
            articleBody.value = "Loading article...";
            loadingContent.value = true;

            const proxy = "https://corsproxy.io/?";
            try {
                const response = await fetch(proxy + encodeURIComponent(article.link));
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "text/html");

                // Target standard article containers, fallback to body
                const content = doc.querySelector("article") ||
                doc.querySelector("main") ||
                doc.querySelector(".article-body") ||
                doc.body;

                // Sanitize: Remove noise that breaks layouts
                const junk = content.querySelectorAll("script, iframe, nav, footer, style, header, .ads");
                junk.forEach(el => el.remove());

                articleBody.value = content.innerHTML;
            } catch (e) {
                articleBody.value = "Could not load reader view. The site may block scraping.";
            } finally {
                loadingContent.value = false;
            }
        };

        // Initialize
        fetchNews();

        return {
            articles,
            loading,
            currentCat,
            categories: Object.keys(feeds),
          fetchNews,
          openArticle,
          activeArticle,
          articleBody,
          loadingContent
        };
    }
}).mount('#app');
