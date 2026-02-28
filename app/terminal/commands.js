export const Commands = {
    // List directory contents
    ls: (args, fs, state) => {
        const currentPath = state.path.join('/');
        const items = fs.filter(item => item.path === currentPath);
        if (items.length === 0) return "Directory is empty.";
        return items.map(item => `${item.isDir ? '📁' : '📄'} ${item.name}`).join('\n');
    },

    // Change directory
    cd: (args, fs, state) => {
        const target = args[0];
        if (!target || target === "~") {
            state.path = ['avero', 'user'];
            return "";
        }
        if (target === "..") {
            if (state.path.length > 1) state.path.pop();
            return "";
        }
        
        const currentPath = state.path.join('/');
        const dir = fs.find(item => item.isDir && item.name === target && item.path === currentPath);
        
        if (dir) {
            state.path.push(target);
            return "";
        }
        return `cd: no such directory: ${target}`;
    },

    // Create a file (synced with Files app)
    touch: (args, fs, state) => {
        const name = args[0];
        if (!name) return "touch: missing file operand";
        const currentPath = state.path.join('/');
        
        fs.push({
            id: Date.now().toString(),
            name: name,
            path: currentPath,
            isDir: false,
            content: ""
        });
        return "";
    },

    // Create a directory
    mkdir: (args, fs, state) => {
        const name = args[0];
        if (!name) return "mkdir: missing operand";
        const currentPath = state.path.join('/');
        
        fs.push({
            id: Date.now().toString(),
            name: name,
            path: currentPath,
            isDir: true
        });
        return "";
    },

    // View file content
    cat: (args, fs, state) => {
        const name = args[0];
        const currentPath = state.path.join('/');
        const file = fs.find(f => !f.isDir && f.name === name && f.path === currentPath);
        return file ? file.content : `cat: ${name}: No such file`;
    },

    // System Information
    sysinfo: () => {
        return [
            "AVERO OS v1.0.4",
            `Kernel: Web-A1 (Chromium Engine)`,
            `Memory: ${(performance.memory?.usedJSHeapSize / 1048576 || 0).toFixed(2)} MB / ${(performance.memory?.jsHeapSizeLimit / 1048576 || 0).toFixed(2)} MB`,
            "Security: HaGeZi Multi AdBlock Active",
            "Shell: Avero-Bash v2.0"
        ].join('\n');
    },

    // JavaScript Execution (Console Access)
    exec: (args) => {
        const code = args.join(' ');
        if (!code) return "exec: usage: exec [javascript code]";
        try {
            const result = eval(code);
            return String(result);
        } catch (e) {
            return `Console Error: ${e.message}`;
        }
    },

    // Help menu
    help: () => {
        return [
            "Available commands:",
            "  ls              - List files",
            "  cd [dir]        - Change directory",
            "  mkdir [name]    - Create directory",
            "  touch [name]    - Create empty file",
            "  cat [file]      - Read file content",
            "  exec [code]     - Execute JS in console",
            "  sysinfo         - Show system specs",
            "  clear           - Wipe terminal screen",
            "  whoami          - Current user info"
        ].join('\n');
    },

    whoami: () => "avero@user (Administrator)"
};
