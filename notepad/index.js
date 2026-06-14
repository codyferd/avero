const { createApp, ref, computed, onMounted, nextTick } = Vue;

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
        // Multi-Tab Data Registry State
        const openTabs = ref([]);
        const currentTabId = ref(null);
        
        // Layout Split Geometry State
        const sidebarWidth = ref(240);
        const isResizing = ref(false);

        // Active Selection Location States
        const cursorLine = ref(1);
        const cursorCol = ref(1);

        const projectTree = ref([]);
        const showTerminal = ref(false);
        const terminalOutput = ref([]);
        const editor = ref(null);

        // Core dynamic getters bound tightly to reactive active workspace indexes
        const activeTab = computed(() => openTabs.value.find(t => t.id === currentTabId.value));
        const content = computed({
            get: () => activeTab.value ? activeTab.value.content : '',
            set: (val) => { if (activeTab.value) activeTab.value.content = val; }
        });
        const fileHandle = computed(() => activeTab.value ? activeTab.value.handle : null);
        const isDirty = computed(() => activeTab.value ? activeTab.value.isDirty : false);

        // Multi-Axis Single-Pass Lexical Processor Compiler
        const highlightedContent = computed(() => {
            const code = content.value;
            if (!code) return "\n";

            const tokenRegex = /(?<comment>\/\/.*$)|(?<string>(['"`])(?:\\.|[^\\])*?\2)|(?<keyword>\b(const|let|var|function|return|if|else|for|while|import|export|class|new|await|async|yield|switch|case|break|continue|default|try|catch|finally)\b)|(?<bool>\b(true|false|null|undefined)\b)|(?<number>\b\d+\b)/gm;

            let lastIndex = 0;
            let htmlResult = '';
            const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            let match;
            while ((match = tokenRegex.exec(code)) !== null) {
                if (match.index > lastIndex) {
                    htmlResult += escapeHtml(code.substring(lastIndex, match.index));
                }
                const groups = match.groups;
                const totalMatch = match[0];

                if (groups.comment) htmlResult += `<span class="token-comment">${escapeHtml(totalMatch)}</span>`;
                else if (groups.string) htmlResult += `<span class="token-string">${escapeHtml(totalMatch)}</span>`;
                else if (groups.keyword) htmlResult += `<span class="token-keyword">${totalMatch}</span>`;
                else if (groups.bool) htmlResult += `<span class="token-bool">${totalMatch}</span>`;
                else if (groups.number) htmlResult += `<span class="token-number">${totalMatch}</span>`;
                else htmlResult += escapeHtml(totalMatch);

                lastIndex = tokenRegex.lastIndex;
            }
            if (lastIndex < code.length) htmlResult += escapeHtml(code.substring(lastIndex));
            return htmlResult + "\n";
        });

        // Tab Interception and Insertion Mechanics
        const handleTab = (e) => {
            const el = editor.value;
            if (!el) return;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const originalVal = content.value;

            content.value = originalVal.substring(0, start) + "    " + originalVal.substring(end);
            
            nextTick(() => {
                el.selectionStart = el.selectionEnd = start + 4;
                markDirty();
                trackCursor();
            });
        };

        // Real-Time Line / Character Counter tracking logic loops
        const trackCursor = () => {
            const el = editor.value;
            if (!el) return;
            const textBeforeCursor = el.value.substring(0, el.selectionStart);
            const lines = textBeforeCursor.split('\n');
            cursorLine.value = lines.length;
            cursorCol.value = lines[lines.length - 1].length + 1;
        };

        const handleInput = () => {
            trackCursor();
        };

        // Sidebar Horizontal Width Resizer Logic Drawer
        const startSidebarDrag = (e) => {
            e.preventDefault();
            isResizing.value = true;
            const startWidth = sidebarWidth.value;
            const startX = e.clientX;

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                sidebarWidth.value = Math.max(140, Math.min(500, startWidth + deltaX));
            };

            const onMouseUp = () => {
                isResizing.value = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        // Tab Switching & Management Pipeline
        const selectFileByHandle = async (handle) => {
            const existing = openTabs.value.find(t => t.handle && t.handle.name === handle.name);
            if (existing) {
                switchTab(existing.id);
                return;
            }
            try {
                const file = await handle.getFile();
                const fileText = await file.text();
                const newId = Date.now().toString();
                openTabs.value.push({
                    id: newId,
                    name: handle.name,
                    content: fileText,
                    handle: handle,
                    isDirty: false
                });
                switchTab(newId);
            } catch (err) { console.error("Could not expand canvas handle stream data context", err); }
        };

        const switchTab = (id) => {
            currentTabId.value = id;
            nextTick(() => {
                trackCursor();
                if (editor.value) editor.value.focus();
            });
        };

        const closeTab = (id) => {
            const index = openTabs.value.findIndex(t => t.id === id);
            if (index === -1) return;
            openTabs.value.splice(index, 1);
            if (currentTabId.value === id) {
                currentTabId.value = openTabs.value.length ? openTabs.value[Math.max(0, index - 1)].id : null;
            }
        };

        // Standard File System IO Routines
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

        const openFile = async () => {
            try {
                const [handle] = await window.showOpenFilePicker();
                await selectFileByHandle(handle);
            } catch (e) {}
        };

        const saveFile = async () => {
            if (!activeTab.value) return;
            try {
                if (!fileHandle.value) {
                    const newHandle = await window.showSaveFilePicker();
                    activeTab.value.handle = newHandle;
                    activeTab.value.name = newHandle.name;
                }
                const writable = await activeTab.value.handle.createWritable();
                await writable.write(content.value);
                await writable.close();
                activeTab.value.isDirty = false;
            } catch (e) { console.error("Error committing serialization state write", e); }
        };

        const runCode = () => {
            showTerminal.value = true;
            const originalLog = console.log;
            try {
                console.log = (m) => terminalOutput.value.push({ type: 'info', msg: String(m) });
                new Function(content.value)();
            } catch (err) {
                terminalOutput.value.push({ type: 'error', msg: err.message });
            } finally {
                console.log = originalLog;
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
            openTabs, currentTabId, sidebarWidth, isResizing, cursorLine, cursorCol,
            projectTree, showTerminal, terminalOutput, editor, content, fileHandle, isDirty,
            highlightedContent, lineCount: computed(() => content.value.split('\n').length || 1),
            openFolder, openFile, saveFile, runCode, syncScroll, handleInput, handleTab, trackCursor,
            markDirty: () => { if (activeTab.value) activeTab.value.isDirty = true; },
            toggleTerminal: () => showTerminal.value = !showTerminal.value,
            startSidebarDrag, selectFileByHandle, switchTab, closeTab
        };
    }
}).mount('#app');