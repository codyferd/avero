// commands.js
export const Commands = {
    // NEOFETCH-STYLE SYSTEM INFO
    fetch: (args) => {
        return `
   .-.      Avero OS [Version 2026.2]
  oo|       -------------------------
 /  \\       Host: Avero-Web-Kernel
 \\|/        Uptime: ${Math.floor(performance.now()/1000)}s
  V         Shell: AveroShell v3.0
            Resolution: ${window.innerWidth}x${window.innerHeight}
            Terminal: Vue-Reactive-Term
        `;
    },

    // FILE GETTER (HTTP Client)
    get: async (args, fs, state) => {
        if (!args[0]) return "Usage: get <url>";
        try {
            const url = args[0];
            const name = url.split('/').pop() || 'downloaded_file.txt';
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const content = await resp.text();
            
            fs.value.push({
                id: Date.now(),
                name: name,
                content: content,
                path: state.path.value.join('/'),
                isDir: false
            });
            return `Success: Retrieved ${name} (${content.length} bytes)`;
        } catch (e) {
            return `Get Error: ${e.message}`;
        }
    },

    // CORE COMMANDS RESTORED
    ls: (args, fs, state) => {
        const cur = state.path.value.join('/');
        const items = fs.value.filter(f => f.path === cur);
        if (items.length === 0) return "(empty)";
        return items.map(i => i.isDir ? `📂 ${i.name}/` : `📄 ${i.name}`).join('\n');
    },

    cd: (args, fs, state) => {
        if (!args[0] || args[0] === '..') {
            if (state.path.value.length > 2) state.path.value.pop();
            return `Moved to /${state.path.value.join('/')}`;
        }
        const target = fs.value.find(f => f.isDir && f.name === args[0] && f.path === state.path.value.join('/'));
        if (target) {
            state.path.value.push(args[0]);
            return `Moved to /${state.path.value.join('/')}`;
        }
        return `cd: no such directory: ${args[0]}`;
    },

    mkdir: (args, fs, state) => {
        if (!args[0]) return "Usage: mkdir <name>";
        fs.value.push({ id: Date.now(), name: args[0], path: state.path.value.join('/'), isDir: true });
        return `Created directory ${args[0]}`;
    },

    touch: (args, fs, state) => {
        if (!args[0]) return "Usage: touch <name>";
        fs.value.push({ id: Date.now(), name: args[0], content: "", path: state.path.value.join('/'), isDir: false });
        return `Created file ${args[0]}`;
    },

    rm: (args, fs, state) => {
        if (!args[0]) return "Usage: rm <name>";
        const cur = state.path.value.join('/');
        const i = fs.value.findIndex(f => f.name === args[0] && f.path === cur);
        if (i === -1) return "File not found";
        
        const target = fs.value[i];
        if (target.isDir) {
            const sub = `${target.path}/${target.name}`;
            fs.value = fs.value.filter(f => !f.path.startsWith(sub));
        }
        fs.value.splice(i, 1);
        return `Removed ${args[0]}`;
    },

    cat: (args, fs, state) => {
        if (!args[0]) return "Usage: cat <file>";
        const file = fs.value.find(f => f.name === args[0] && f.path === state.path.value.join('/') && !f.isDir);
        return file ? file.content : "cat: file not found";
    },

    script: (args, fs, state) => {
        try {
            const result = eval(args.join(' '));
            return result !== undefined ? String(result) : "Executed JS successfully.";
        } catch (e) {
            return `JS Error: ${e.message}`;
        }
    }
};
