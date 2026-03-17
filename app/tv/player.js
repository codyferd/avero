window.AveroPlayer = {
    init(containerId, episode) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Sanitize the Input (Basic string escape to prevent XSS in the URL)
        const safeId = String(episode.id).replace(/[^\w-]/g, '');

        const embedUrl = episode.yt
        ? `https://www.youtube.com/embed/${safeId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`
        : episode.url; // Use URL for local files

        // 2. The Secure Frame Construction
        // REMOVED: allow-popups, allow-popups-to-escape-sandbox, allow-top-navigation
        // ADDED: allow-presentation (for casting)
        container.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 30px; border: 1px solid rgba(255,255,255,0.08); background: #000; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
        <iframe
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
        src="${embedUrl}"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy"
        title="Avero TV Secure Player">
        </iframe>
        </div>
        `;
    }
};
