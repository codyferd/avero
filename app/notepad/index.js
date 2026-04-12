const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const content = ref('');
        const fileHandle = ref(null);
        const folderFiles = ref([]);
        const isDirty = ref(false);
        const fontSize = ref(16);
        const spellcheck = ref(false);
        const saveStatus = ref('');
        const showConfirmModal = ref(false);
        const editor = ref(null); // Reference to the textarea

        // --- STATS ---
        const wordCount = computed(() => {
            const words = content.value.trim().split(/\s+/);
            return content.value.trim() === '' ? 0 : words.length;
        });
        const lineCount = computed(() => content.value.split('\n').length);

        // --- SYNTAX HIGHLIGHTING ENGINE ---
        const highlightedContent = computed(() => {
            if (!content.value) return '';
            if (typeof Prism === 'undefined') return content.value;

            const ext = fileHandle.value?.name.split('.').pop() || 'md';
            const langMap = {
                js: 'javascript',
                py: 'python',
                html: 'markup',
                xml: 'markup',
                css: 'css',
                md: 'markdown'
            };

            const lang = langMap[ext] || 'markdown';
            const grammar = Prism.languages[lang];

            // If the autoloader hasn't loaded the language yet, return plain text
            // Prism will catch up on the next tick
            if (!grammar) return content.value.replace(/&/g, "&amp;").replace(/</g, "&lt;");

            try {
                // Prism returns a string of HTML spans
                return Prism.highlight(content.value, grammar, lang);
            } catch (e) {
                return content.value;
            }
        });

        // --- SCROLL SYNCHRONIZATION ---
        const syncScroll = (e) => {
            const syntaxLayer = document.querySelector('.syntax-layer');
            if (syntaxLayer) {
                syntaxLayer.scrollTop = e.target.scrollTop;
                syntaxLayer.scrollLeft = e.target.scrollLeft;
            }
        };

        const markDirty = () => { isDirty.value = true; };

        // --- FILE OPERATIONS ---
        const triggerCreateNew = () => {
            if (isDirty.value) { showConfirmModal.value = true; }
            else { performCreateNew(); }
        };

        const performCreateNew = () => {
            content.value = '';
            fileHandle.value = null;
            isDirty.value = false;
            showConfirmModal.value = false;
        };

        const openFile = async (handle = null) => {
            try {
                const actualHandle = handle || (await window.showOpenFilePicker({
                    types: [{ description: 'Project Files', accept: { '*/*': ['.txt', '.md', '.js', '.py', '.html', '.css'] } }]
                }))[0];

                const file = await actualHandle.getFile();
                content.value = await file.text();
                fileHandle.value = actualHandle;
                isDirty.value = false;

                // Force Prism to recognize the new language
                nextTick(() => {
                    if (typeof Prism !== 'undefined') Prism.highlightAll();
                });
            } catch (err) { console.warn('User cancelled open.'); }
        };

        const openFolder = async () => {
            try {
                const directoryHandle = await window.showDirectoryPicker();
                const files = [];
                for await (const entry of directoryHandle.values()) {
                    if (entry.kind === 'file') files.push(entry);
                }
                folderFiles.value = files.sort((a, b) => a.name.localeCompare(b.name));
                showStatus(`Project Loaded: ${files.length} files`);
            } catch (err) { console.warn('Directory access denied.'); }
        };

        const saveFile = async () => {
            if (!fileHandle.value) return saveAs();
            try {
                const writable = await fileHandle.value.createWritable();
                await writable.write(content.value);
                await writable.close();
                isDirty.value = false;
                showStatus('File Saved');
            } catch (err) { showStatus('Write Error'); }
        };

        const saveAs = async () => {
            try {
                fileHandle.value = await window.showSaveFilePicker();
                await saveFile();
            } catch (err) { console.warn('Save As cancelled.'); }
        };

        const showStatus = (msg) => {
            saveStatus.value = msg;
            setTimeout(() => saveStatus.value = '', 3000);
        };

        const toggleSpellcheck = () => { spellcheck.value = !spellcheck.value; };

        onMounted(() => {
            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile(); }
                if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFile(); }
            });
        });

        return {
            content, fileHandle, folderFiles, isDirty, fontSize, spellcheck, saveStatus,
          wordCount, lineCount, highlightedContent, showConfirmModal,
          triggerCreateNew, openFile, openFolder, saveFile, saveAs, markDirty,
          performCreateNew, syncScroll, toggleSpellcheck, editor
        };
    }
}).mount('#app');
