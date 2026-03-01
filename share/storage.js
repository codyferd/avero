// Avero OS - Robust Storage Engine v2.0
window.AveroStorage = {
    KEY: 'avero_fs_local',

    getFS() {
        const data = localStorage.getItem(this.KEY);
        if (data) return JSON.parse(data);
        
        const defaultFS = [
            { id: 'root', name: 'avero', path: '', isDir: true },
            { id: 'usr', name: 'user', path: 'avero', isDir: true },
            { id: 'readme', name: 'readme.txt', path: 'avero/user', content: 'Welcome to Avero!', isDir: false }
        ];
        this.saveFS(defaultFS);
        return defaultFS;
    },

    saveFS(fs) {
        localStorage.setItem(this.KEY, JSON.stringify(fs));
        window.dispatchEvent(new Event('storage'));
    },

    save(name, content, path, isDir = false, id = null) {
        const fs = this.getFS();
        const existingIndex = id ? fs.findIndex(f => f.id === id) : -1;

        // If renaming a directory, we must update all children's paths
        if (existingIndex > -1 && isDir && fs[existingIndex].name !== name) {
            const oldPath = `${fs[existingIndex].path}/${fs[existingIndex].name}`;
            const newPath = `${fs[existingIndex].path}/${name}`;
            fs.forEach(item => {
                if (item.path.startsWith(oldPath)) {
                    item.path = item.path.replace(oldPath, newPath);
                }
            });
        }

        const obj = {
            id: id || `avero-${Math.random().toString(36).substr(2, 9)}`,
            name,
            content: content || "",
            path,
            isDir,
            ts: Date.now()
        };

        if (existingIndex > -1) fs[existingIndex] = obj;
        else fs.push(obj);

        this.saveFS(fs);
        return obj;
    },

    delete(id) {
        let fs = this.getFS();
        const item = fs.find(f => f.id === id);
        if (!item) return;

        if (item.isDir) {
            const targetPrefix = `${item.path}/${item.name}`;
            // Remove the folder AND everything that starts with its path
            fs = fs.filter(f => f.id !== id && !f.path.startsWith(targetPrefix));
        } else {
            fs = fs.filter(f => f.id !== id);
        }

        this.saveFS(fs);
    }
};
