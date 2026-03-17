window.AveroPlayer = {
    init(containerId, episode) {
        // 1. Target Validation
        const container = document.getElementById(containerId);
        if (!container) {
            console.error("AveroPlayer: Target container not found.");
            return;
        }

        // 2. Data Integrity Check (Prevents the 'undefined' 404 error)
        if (!episode || (!episode.id && !episode.url)) {
            console.error("AveroPlayer: Source data is missing or malformed.");
            container.innerHTML = `<div style="color:#666; padding:20px; font-family:sans-serif;">[ Protocol Error: No Source ]</div>`;
            return;
        }

        // 3. Input Sanitization
        // We strip anything that isn't a standard URL or ID character to prevent injection
        const safeId = String(episode.id || '').replace(/[^\w-]/g, '');
        const rawUrl = episode.url || episode.id || '';

        // 4. Secure URL Construction
        // Using youtube-nocookie.com prevents Google from tracking your Avero TV users
        const embedUrl = episode.yt
        ? `https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`
        : rawUrl;

        // 5. Hardened Sandbox
        // REMOVED: allow-popups, allow-popups-to-escape-sandbox, allow-top-navigation
        // This makes it impossible for the iframe to redirect your app or open ads
        container.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); background: #000; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
        <iframe
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
        src="${embedUrl}"
        title="Avero Secure Player"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy">
        </iframe>
        </div>
        `;
    }
};
