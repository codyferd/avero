const { createApp, ref, computed, nextTick } = Vue;

createApp({
    setup() {
        const rootHandle = ref(null);
        const currentFiles = ref([]);
        const breadcrumbs = ref(['System']);
        const pathStack = ref([]);
        const search = ref('');
        const selectedFile = ref(null);
        const modalInput = ref(null);

        // Clipboard State
        const clipboard = ref({ item: null, mode: null, sourceFolder: null });

        // Modal State
        const modal = ref({ show: false, title: '', message: '', type: 'prompt', input: '', onConfirm: null });

        const currentHandle = computed(() => pathStack.value[pathStack.value.length - 1]);

        const openModal = (title, message, type, onConfirm) => {
            modal.value = { show: true, title, message, type, input: '', onConfirm };
            if (type === 'prompt') {
                nextTick(() => { modalInput.value?.focus(); });
            }
        };

        const confirmModal = () => {
            if (modal.value.onConfirm) modal.value.onConfirm(modal.value.input);
            modal.value.show = false;
        };

        const loadFiles = async (handle) => {
            const files = [];
            for await (const entry of handle.values()) { files.push(entry); }
            currentFiles.value = files.sort((a, b) => (b.kind === 'directory') - (a.kind === 'directory') || a.name.localeCompare(b.name));
        };

        // --- FIXED CREATION ---
        const createNew = (type) => {
            openModal(`New ${type}`, `Enter name:`, 'prompt', async (name) => {
                if (!name) return;
                try {
                    // We add a check to see if it exists to avoid TypeMismatch
                    if (type === 'file') {
                        await currentHandle.value.getFileHandle(name, { create: true });
                    } else {
                        await currentHandle.value.getDirectoryHandle(name, { create: true });
                    }
                    await loadFiles(currentHandle.value);
                } catch (e) {
                    alert(`Creation failed: ${e.name}. Ensure a ${type === 'file' ? 'folder' : 'file'} with that name doesn't already exist.`);
                }
            });
        };

        // --- FIXED PASTE ---
        const pasteItem = async () => {
            const { item, mode, sourceFolder } = clipboard.value;
            if (!item) return;

            try {
                if (item.kind === 'file') {
                    // 1. Get the source file data
                    const fileData = await item.getFile();
                    // 2. Create the new file in current directory
                    const newHandle = await currentHandle.value.getFileHandle(item.name, { create: true });
                    // 3. Write data
                    const writable = await newHandle.createWritable();
                    await writable.write(fileData);
                    await writable.close();
                } else {
                    // Directory copy (Browser limitation: can only create empty folder)
                    await currentHandle.value.getDirectoryHandle(item.name, { create: true });
                }

                // 4. If CUT, remove the original
                if (mode === 'cut' && sourceFolder) {
                    await sourceFolder.removeEntry(item.name, { recursive: true });
                }

                await loadFiles(currentHandle.value);
                clipboard.value = { item: null, mode: null, sourceFolder: null };
            } catch (e) {
                console.error("Paste Error:", e);
                alert("Paste failed. Note: You cannot paste into the same folder the file originated from without renaming it.");
            }
        };

        // --- Helper Logic ---
        const initFileSystem = async () => {
            const handle = await window.showDirectoryPicker();
            rootHandle.value = handle;
            pathStack.value = [handle];
            await loadFiles(handle);
        };

        const deleteItem = () => {
            if (!selectedFile.value) return;
            openModal('Delete', `Delete "${selectedFile.value.name}"?`, 'confirm', async () => {
                await currentHandle.value.removeEntry(selectedFile.value.name, { recursive: true });
                selectedFile.value = null;
                await loadFiles(currentHandle.value);
            });
        };

        const copyItem = () => { clipboard.value = { item: selectedFile.value, mode: 'copy', sourceFolder: currentHandle.value }; };
        const cutItem = () => { clipboard.value = { item: selectedFile.value, mode: 'cut', sourceFolder: currentHandle.value }; };

        const handleOpen = async (file) => {
            if (file.kind === 'directory') {
                breadcrumbs.value.push(file.name);
                pathStack.value.push(file);
                await loadFiles(file);
                selectedFile.value = null;
            }
        };

        const goBack = async () => {
            if (pathStack.value.length > 1) {
                pathStack.value.pop();
                breadcrumbs.value.pop();
                await loadFiles(currentHandle.value);
            }
        };

        const jumpTo = async (index) => {
            pathStack.value = pathStack.value.slice(0, index + 1);
            breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
            await loadFiles(currentHandle.value);
        };

        return {
            rootHandle, currentFiles, breadcrumbs, search, selectedFile, pathStack, clipboard, modal, modalInput,
          filteredFiles: computed(() => search.value ? currentFiles.value.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase())) : currentFiles.value),
          getIcon: (n) => ({ js:'📜', html:'🌐', css:'🎨', txt:'📄', md:'📝', png:'🖼️' }[n.split('.').pop()] || '📄'),
          initFileSystem, handleOpen, goBack, jumpTo, createNew, deleteItem, copyItem, cutItem, pasteItem, confirmModal
        };
    }
}).mount('#app');

