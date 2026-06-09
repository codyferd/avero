if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Dynamically locate the base path
        const basePath = window.location.pathname.includes('/avero/') ? '/avero/' : '/';
        
        // Point to sw.js at the root level instead of inside share/
        navigator.serviceWorker.register(`${basePath}sw.js`, {
            scope: basePath
        })
    });
}
