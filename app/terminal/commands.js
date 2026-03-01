export const Commands = {
    ls: (args, fs, state) => {
        const p = state.path.join('/');
        const items = fs.filter(f => f.path === p);
        if (args.includes('-l')) {
            return items.map(i => `${i.isDir ? 'd' : '-'}rwxr-xr-x  1  avero  staff  ${i.content?.length || 0}  Mar 1  ${i.name}`).join('\n');
        }
        return items.map(i => i.isDir ? i.name + '/' : i.name).join('    ');
    },

    cd: (args, fs, state) => {
        const target = args[0];
        if (!target || target === "~") { state.path = ['avero', 'user']; return ""; }
        if (target === "..") { if (state.path.length > 1) state.path.pop(); return ""; }
        
        const dir = fs.find(f => f.isDir && f.name === target && f.path === state.path.join('/'));
        if (dir) { state.path.push(target); return ""; }
        return `cd: no such directory: ${target}`;
    },

    touch: (args, fs, state) => {
        if (!args[0]) return "touch: missing file operand";
        AveroStorage.save(args[0], "", state.path.join('/'), false);
        return "";
    },

    mkdir: (args, fs, state) => {
        if (!args[0]) return "mkdir: missing operand";
        AveroStorage.save(args[0], "", state.path.join('/'), true);
        return "";
    },

    cat: (args, fs, state) => {
        const file = fs.find(f => !f.isDir && f.name === args[0] && f.path === state.path.join('/'));
        return file ? file.content : `cat: ${args[0]}: No such file`;
    },

    rm: (args, fs, state) => {
        const item = fs.find(f => f.name === args[0] && f.path === state.path.join('/'));
        if (!item) return `rm: ${args[0]}: No such file`;
        AveroStorage.delete(item.id);
        return "";
    },

    sysinfo: () => {
        return `KERNEL: Avero WebOS\nARCH: x86_64_WEB\nMEM: ${(performance.memory?.usedJSHeapSize / 1e6 || 0).toFixed(2)}MB / 4096MB\nSTATUS: ONLINE`;
    },

    help: () => "Available: ls (-l), cd, cat, touch, mkdir, rm, sysinfo, clear, help"
};
