export const storage = {
    // Save or update a file/folder
    saveFile(name, content, path, isDir = false) {
        const fs = this.getFiles();
        const existingIndex = fs.findIndex(f => f.name === name && f.path === path);

        const fileObj = {
            name,
            content,
            path,
            isDir,
            updatedAt: Date.now()
        };

        if (existingIndex > -1) {
            fs[existingIndex] = fileObj;
        } else {
            fs.push(fileObj);
        }

        localStorage.setItem('avero_fs', JSON.stringify(fs));
    },

    // Get all files
    getFiles() {
        const data = localStorage.getItem('avero_fs');
        return data ? JSON.parse(data) : [
            { name: 'system', path: 'avero', isDir: true },
            { name: 'user', path: 'avero', isDir: true },
            { name: 'readme.txt', path: 'avero/user', content: 'Welcome to Avero OS!', isDir: false }
        ];
    },

    // Delete a file
    deleteFile(name, path) {
        let fs = this.getFiles();
        fs = fs.filter(f => !(f.name === name && f.path === path));
        localStorage.setItem('avero_fs', JSON.stringify(fs));
    }
};
