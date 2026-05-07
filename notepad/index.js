const { createApp, ref, computed } = Vue;

const TreeItem = {
    name: 'TreeItem',
    props: ['item'],
    template: `
    <div class="select-none">
    <div @click="handleClick" class="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-white/5 text-[11px]">
    <span class="opacity-40 w-4">{{ item.kind === 'directory' ? (isOpen ? '📂' : '📁') : '📄' }}</span>
    <span class="truncate opacity-80">{{ item.name }}</span>
    </div>
    <div v-if="isOpen && item.children" class="ml-3 border-l border-white/10">
    <tree-item v-for="child in item.children" :key="child.name" :item="child" @open-file="$emit('open-file', $event)"></tree-item>
    </div>
    </div>
    `,
    data() { return { isOpen: false }; },
    methods: {
        handleClick() {
            if (this.item.kind === 'directory') this.isOpen = !this.isOpen;
            else this.$emit('open-file', this.item.handle);
        }
    }
};

createApp({
    components: { TreeItem },
    setup() {
        const content = ref('');
        const fileHandle = ref(null);
        const projectTree = ref([]);
        const isDirty = ref(false);
        const showTerminal = ref(false);
        const terminalOutput = ref([]);

        // Robust Single-Pass Visual Logic
        const highlightedContent = computed(() => {
            // Step 1: Escape HTML characters to prevent rendering collision
            let html = content.value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

            // Step 2: Apply highlighting using specific CSS classes
            // We use capture groups to ensure we don't double-wrap
            html = html
            // Comments (match first to avoid highlighting keywords inside them)
            .replace(/\/\/.*$/gm, '<span class="token-comment">$&</span>')
            // Strings
            .replace(/(['"`])(.*?)\1/g, '<span class="token-string">$1$2$1</span>')
            // Keywords (Strict word boundaries \b to prevent partial matches)
            .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|class|new|await|async|yield|switch|case|break|continue|default|try|catch|finally)\b/g, '<span class="token-keyword">$1</span>')
            // Booleans & Numbers
            .replace(/\b(true|false|null|undefined)\b/g, '<span class="token-bool">$1</span>')
            .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');

            return html + "\n";
        });

        const openFolder = async () => {
            try {
                const dirHandle = await window.showDirectoryPicker();
                projectTree.value = [await scanDirectory(dirHandle)];
            } catch (e) { console.error("Access Denied", e); }
        };

        const scanDirectory = async (handle) => {
            const node = { name: handle.name, handle: handle, kind: handle.kind, children: [] };
            if (handle.kind === 'directory') {
                for await (const entry of handle.values()) {
                    node.children.push(await scanDirectory(entry));
                }
                node.children.sort((a, b) => (b.kind === 'directory') - (a.kind === 'directory') || a.name.localeCompare(b.name));
            }
            return node;
        };

        const openFile = async (handle = null) => {
            try {
                const actual = handle || (await window.showOpenFilePicker())[0];
                const file = await actual.getFile();
                content.value = await file.text();
                fileHandle.value = actual;
                isDirty.value = false;
            } catch (e) {}
        };

        const saveFile = async () => {
            if (!fileHandle.value) fileHandle.value = await window.showSaveFilePicker();
            const writable = await fileHandle.value.createWritable();
            await writable.write(content.value);
            await writable.close();
            isDirty.value = false;
        };

        const runCode = () => {
            showTerminal.value = true;
            try {
                const originalLog = console.log;
                console.log = (m) => terminalOutput.value.push({ type: 'info', msg: String(m) });
                new Function(content.value)();
                console.log = originalLog;
            } catch (err) {
                terminalOutput.value.push({ type: 'error', msg: err.message });
            }
        };

        const syncScroll = (e) => {
            const syntax = document.querySelector('.syntax-layer');
            if (syntax) {
                syntax.scrollTop = e.target.scrollTop;
                syntax.scrollLeft = e.target.scrollLeft;
            }
        };

        return {
            content, fileHandle, projectTree, isDirty, showTerminal, terminalOutput,
          highlightedContent, lineCount: computed(() => content.value.split('\n').length || 1),
          openFolder, openFile, saveFile, runCode, syncScroll, markDirty: () => isDirty.value = true,
          toggleTerminal: () => showTerminal.value = !showTerminal.value
        };
    }
}).mount('#app');

