export const Commands = {
    // List directory contents with flags support (e.g., -l)
    ls: (args, fs, state) => {
        const currentPath = state.path.join('/');
        const items = fs.filter(item => item.path === currentPath);
        if (items.length === 0) return "total 0";
        
        if (args.includes('-l')) {
            return items.map(item => {
                const type = item.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                return `${type}  avero  user  0  Mar 1  ${item.name}`;
            }).join('\n');
        }
        return items.map(item => `${item.isDir ? '📁' : '📄'} ${item.name}`).join('  ');
    },

    // Change directory with absolute and relative path support
    cd: (args, fs, state) => {
        const target = args[0];
        if (!target || target === "~") { state.path = ['avero', 'user']; return ""; }
        if (target === "/") { state.path = ['avero']; return ""; }
        
        const segments = target.split('/').filter(s => s.length > 0);
        let tempPath = [...state.path];

        for (const seg of segments) {
            if (seg === "..") {
                if (tempPath.length > 1) tempPath.pop();
            } else if (seg === ".") {
                continue;
            } else {
                const currentStr = tempPath.join('/');
                const dir = fs.find(i => i.isDir && i.name === seg && i.path === currentStr);
                if (dir) tempPath.push(seg);
                else return `cd: no such directory: ${seg}`;
            }
        }
        state.path = tempPath;
        return "";
    },

    pwd: (args, fs, state) => `/${state.path.join('/')}`,

    // Create file
    touch: (args, fs, state) => {
        if (!args[0]) return "touch: missing file operand";
        const currentPath = state.path.join('/');
        if (fs.some(i => i.name === args[0] && i.path === currentPath)) return "";
        fs.push({ id: `f-${Date.now()}`, name: args[0], path: currentPath, isDir: false, content: "" });
        return "";
    },

    // Create directory
    mkdir: (args, fs, state) => {
        if (!args[0]) return "mkdir: missing operand";
        const currentPath = state.path.join('/');
        fs.push({ id: `d-${Date.now()}`, name: args[0], path: currentPath, isDir: true });
        return "";
    },

    // Remove files or directories (-r)
    rm: (args, fs, state) => {
        const recursive = args.includes('-r');
        const targetName = args.find(a => !a.startsWith('-'));
        if (!targetName) return "rm: missing operand";

        const currentPath = state.path.join('/');
        const index = fs.findIndex(i => i.name === targetName && i.path === currentPath);
        
        if (index === -1) return `rm: cannot remove '${targetName}': No such file or directory`;
        
        if (fs[index].isDir && !recursive) return `rm: cannot remove '${targetName}': Is a directory`;
        
        // If directory and recursive, remove children too
        if (fs[index].isDir) {
            const fullPath = `${currentPath}/${targetName}`;
            const toRemove = fs.filter(i => i.path.startsWith(fullPath));
            toRemove.forEach(rem => {
                const idx = fs.findIndex(f => f.id === rem.id);
                if (idx > -1) fs.splice(idx, 1);
            });
        }
        fs.splice(index, 1);
        return "";
    },

    // Read file
    cat: (args, fs, state) => {
        const currentPath = state.path.join('/');
        const file = fs.find(f => !f.isDir && f.name === args[0] && f.path === currentPath);
        return file ? file.content : `cat: ${args[0]}: No such file`;
    },

    // Write to file: echo "text" > file.txt
    echo: (args, fs, state) => {
        const redirectIdx = args.indexOf('>');
        if (redirectIdx > -1) {
            const content = args.slice(0, redirectIdx).join(' ').replace(/"/g, '');
            const filename = args[redirectIdx + 1];
            if (!filename) return "bash: syntax error near unexpected token 'newline'";
            
            const currentPath = state.path.join('/');
            let file = fs.find(f => f.name === filename && f.path === currentPath);
            if (file) {
                file.content = content;
            } else {
                fs.push({ id: `f-${Date.now()}`, name: filename, path: currentPath, isDir: false, content });
            }
            return "";
        }
        return args.join(' ').replace(/"/g, '');
    },

    // NEW: Execute JavaScript inside the Terminal context
    script: (args, fs, state) => {
        const filename = args[0];
        if (!filename) return "script: usage: script [file.js]";
        const currentPath = state.path.join('/');
        const file = fs.find(f => f.name === filename && f.path === currentPath);
        
        if (!file) return `script: ${filename}: No such file`;
        
        try {
            // Evaluates code within terminal scope
            const result = eval(file.content);
            return result !== undefined ? String(result) : "Script executed successfully.";
        } catch (e) {
            return `Runtime Error: ${e.message}`;
        }
    },

    // JavaScript Console Eval
    exec: (args) => {
        const code = args.join(' ');
        if (!code) return "exec: usage: exec [javascript]";
        try {
            return String(eval(code));
        } catch (e) {
            return `Console Error: ${e.message}`;
        }
    },

    sysinfo: () => {
        return [
            "AVERO Shell v2.1.0",
            `Uptime: ${Math.floor(performance.now()/1000)}s`,
            `Platform: ${navigator.platform}`,
            `Memory: ${(performance.memory?.usedJSHeapSize / 1048576 || 0).toFixed(2)} MB`
        ].join('\n');
    },

    help: () => {
        return [
            "FILE OPS: ls (-l), cd, pwd, mkdir, touch, rm (-r), cat, echo",
            "SCRIPTS:  script [file.js] - Run a JS file from the filesystem",
            "SYSTEM:   exec [code]      - Evaluate JS directly",
            "          sysinfo, clear, whoami, help"
        ].join('\n');
    },

    whoami: () => "avero@root"
};
