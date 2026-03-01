// Avero OS - Global Storage Engine
window.AveroStorage = {
    KEY: 'avero_fs_local',

    // Initialize or get the filesystem
    getFS() {
        const data = localStorage.getItem(this.KEY);
        if (data) return JSON.parse(data);
        
        const defaultFS = [
            { id: 'root', name: 'avero', path: '', isDir: true },
            { id: 'usr', name: 'user', path: 'avero', isDir: true },
            { id: 'readme', name: 'readme.txt', path: 'avero/user', content: 'Welcome to Avero!', isDir: false }
        ];
        localStorage.setItem(this.KEY, JSON.stringify(defaultFS));
        return defaultFS;
    },

    save(name, content, path, isDir = false, id = null) {
        const fs = this.getFS();
        const existingIndex = id ? fs.findIndex(f => f.id === id) : -1;

        const obj = {
            id: id || `obj-${Date.now()}`,
            name,
            content: content || "",
            path,
            isDir,
            ts: Date.now()
        };

        if (existingIndex > -1) fs[existingIndex] = obj;
        else fs.push(obj);

        localStorage.setItem(this.KEY, JSON.stringify(fs));
        window.dispatchEvent(new Event('storage')); // Broadcast to all apps
        return obj;
    },

    delete(id) {
        let fs = this.getFS();
        const item = fs.find(f => f.id === id);
        if (!item) return;

        // Recursive delete for directories
        if (item.isDir) {
            const prefix = `${item.path}/${item.name}`;
            fs = fs.filter(f => f.id !== id && !f.path.startsWith(prefix));
        } else {
            fs = fs.filter(f => f.id !== id);
        }

        localStorage.setItem(this.KEY, JSON.stringify(fs));
        window.dispatchEvent(new Event('storage'));
    }
};
