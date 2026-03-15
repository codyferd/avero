window.AveroPlayer = {
    init(containerId, episode) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const embedUrl = episode.yt
        ? `https://www.youtube.com/embed/${episode.id}?autoplay=1&modestbranding=1&rel=0`
        : episode.id;

        container.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: #000;">
        <iframe
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
        src="${embedUrl}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        allowfullscreen>
        </iframe>
        </div>
        `;
    }
};

