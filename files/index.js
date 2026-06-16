/**
 * Avero Files Platform Core Engine Workspace
 */
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

        // Drag State Buffer Reference
        const draggedItem = ref(null);

        // Modal State Configuration Node
        const modal = ref({ show: false, title: '', message: '', type: 'prompt', input: '', onConfirm: null });

        const currentHandle = computed(() => pathStack.value[pathStack.value.length - 1]);

        // Comprehensive Operational Extension Matrix Mapping File Extensions to Specific Icons
        const fileIconRegistry = {
            // Document Framework formats
            txt: '📄', doc: '📘', docx: '📘', pdf: '📕',
            md: '📝', rtf: '📃', log: '📋',
            
            // Native Programming Languages Codebases
            js: '📜', ts: '⚙️', html: '🌐', css: '🎨', 
            py: '🐍', json: '🔧', c: '🧬', cpp: '🧬', 
            cs: '🎛️', java: '☕', sh: '🐚', bat: '🐚',
            yaml: '⚙️', xml: '🔧',
            
            // Audio-Visual Assets Media Structures
            png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🎞️', 
            svg: '📐', mp3: '🎵', wav: '🔊', flac: '🎶', 
            ogg: '🎵', mp4: '🎬', mkv: '🎥', mov: '🎬',
            
            // Compression Packages & Executable Binaries
            zip: '📦', rar: '📦', tar: '📦', gz: '📦', 
            '7z': '📦', exe: '⚡', apk: '🤖', dmg: '🍏'
        };

        const openModal = (title, message, type, onConfirm, defaultInput = '') => {
            modal.value = { show: true, title, message, type, input: defaultInput, onConfirm };
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
            for await (const entry of handle.values()) { 
                // Inject an explicit reactive key for handling drag-over visual targets cleanly
                entry._isDragTarget = false;
                files.push(entry); 
            }
            currentFiles.value = files.sort((a, b) => (b.kind === 'directory') - (a.kind === 'directory') || a.name.localeCompare(b.name));
        };

        const initFileSystem = async () => {
            try {
                const handle = await window.showDirectoryPicker();
                rootHandle.value = handle;
                pathStack.value = [handle];
                await loadFiles(handle);
            } catch (err) {
                console.warn("Drive Mount Authorization Rejected", err);
            }
        };

        const createNew = (type) => {
            openModal(`Create New ${type}`, `Specify systemic identity token label:`, 'prompt', async (name) => {
                if (!name) return;
                try {
                    if (type === 'file') {
                        await currentHandle.value.getFileHandle(name, { create: true });
                    } else {
                        await currentHandle.value.getDirectoryHandle(name, { create: true });
                    }
                    await loadFiles(currentHandle.value);
                } catch (e) {
                    alert(`Compilation Failure: Element conflict matches explicit entity parameters.`);
                }
            });
        };

        /**
         * STANDARD TOOL SYSTEM EXTENSION: DYNAMIC ITEM RENAMING ARRAYS
         */
                /**
         * STANDARD TOOL SYSTEM EXTENSION: DYNAMIC ITEM RENAMING ARRAYS
         */
        const renameItem = () => {
            if (!selectedFile.value) return;
            const target = selectedFile.value;

            openModal(`Rename Objective Entry`, `Enter a replacement structural string for "${target.name}":`, 'prompt', async (newName) => {
                if (!newName || newName === target.name) return;
                try {
                    if (target.kind === 'file') {
                        // 1. Fetch file object wrapper
                        const originalFile = await target.getFile();
                        // 2. Extract contents as an ArrayBuffer safely containing all raw bytes
                        const fileContents = await originalFile.arrayBuffer();
                        
                        // 3. Mount new structural target handle and write everything out cleanly
                        const newFileHandle = await currentHandle.value.getFileHandle(newName, { create: true });
                        const writableStream = await newFileHandle.createWritable();
                        await writableStream.write(fileContents);
                        await writableStream.close();
                    } else {
                        // Directory deep migration framework helper
                        const deepCopyDirectory = async (sourceHandle, destinationHandle) => {
                            for await (const entry of sourceHandle.values()) {
                                if (entry.kind === 'file') {
                                    const file = await entry.getFile();
                                    const content = await file.arrayBuffer();
                                    const newFile = await destinationHandle.getFileHandle(entry.name, { create: true });
                                    const writer = await newFile.createWritable();
                                    await writer.write(content);
                                    await writer.close();
                                } else if (entry.kind === 'directory') {
                                    const newSubDir = await destinationHandle.getDirectoryHandle(entry.name, { create: true });
                                    await deepCopyDirectory(entry, newSubDir);
                                }
                            }
                        };

                        const newDirectoryHandle = await currentHandle.value.getDirectoryHandle(newName, { create: true });
                        await deepCopyDirectory(target, newDirectoryHandle);
                    }

                    // Remove original structural entry map clean footprint tracking nodes
                    await currentHandle.value.removeEntry(target.name, { recursive: true });
                    selectedFile.value = null;
                    await loadFiles(currentHandle.value);
                } catch (err) {
                    alert(`Renaming failed: structural target constraints violated.`);
                    console.error(err);
                }
            }, target.name);
        };


        /**
         * NATIVE INTERACTION EXTENSION: DRAG AND DROP RUNTIME CONTROLLERS
         */
        const handleDragStart = (event, file) => {
            draggedItem.value = file;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", file.name);
        };

        const handleDragOver = (event, file) => {
            event.preventDefault();
            if (file.kind === 'directory' && draggedItem.value && draggedItem.value.name !== file.name) {
                file._isDragTarget = true;
                event.dataTransfer.dropEffect = "move";
            }
        };

        const handleDragLeave = (event, file) => {
            file._isDragTarget = false;
        };

        const handleDrop = async (event, targetFolder) => {
            event.preventDefault();
            targetFolder._isDragTarget = false;

            if (!draggedItem.value || targetFolder.kind !== 'directory' || draggedItem.value.name === targetFolder.name) {
                return;
            }

            const itemToMove = draggedItem.value;
            try {
                if (itemToMove.kind === 'file') {
                    const originFile = await itemToMove.getFile();
                    const destinationDirectory = await currentHandle.value.getDirectoryHandle(targetFolder.name);
                    
                    const destinationFileHandle = await destinationDirectory.getFileHandle(itemToMove.name, { create: true });
                    const fileWriter = await destinationFileHandle.createWritable();
                    await fileWriter.write(originFile);
                    await fileWriter.close();
                    
                    // Cleanup parent absolute path entry allocation
                    await currentHandle.value.removeEntry(itemToMove.name);
                    await loadFiles(currentHandle.value);
                    selectedFile.value = null;
                } else {
                    alert("Folder relocation trees must contain an explicit manifest track layer configuration. Move cancelled.");
                }
            } catch (err) {
                alert("I/O Routing execution runtime parameter boundary protection fault.");
                console.error(err);
            } finally {
                draggedItem.value = null;
            }
        };

        const pasteItem = async () => {
            const { item, mode, sourceFolder } = clipboard.value;
            if (!item) return;

            try {
                if (item.kind === 'file') {
                    const fileData = await item.getFile();
                    const newHandle = await currentHandle.value.getFileHandle(item.name, { create: true });
                    const writable = await newHandle.createWritable();
                    await writable.write(fileData);
                    await writable.close();
                } else {
                    await currentHandle.value.getDirectoryHandle(item.name, { create: true });
                }

                if (mode === 'cut' && sourceFolder) {
                    await sourceFolder.removeEntry(item.name, { recursive: true });
                }

                await loadFiles(currentHandle.value);
                clipboard.value = { item: null, mode: null, sourceFolder: null };
            } catch (e) {
                alert("Execution routing boundary collision: Duplicate identifiers detected.");
            }
        };

        const deleteItem = () => {
            if (!selectedFile.value) return;
            openModal('Destructive Confirmation Action', `Purge absolute filesystem pointer data for "${selectedFile.value.name}"? This tracking state is irreversible.`, 'confirm', async () => {
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
            getIcon: (filename) => {
                const pieces = filename.split('.');
                if (pieces.length <= 1) return '📄';
                const extension = pieces.pop().toLowerCase();
                return fileIconRegistry[extension] || '📄';
            },
            initFileSystem, handleOpen, goBack, jumpTo, createNew, deleteItem, copyItem, cutItem, pasteItem, confirmModal, renameItem,
            handleDragStart, handleDragOver, handleDragLeave, handleDrop
        };
    }
}).mount('#app');
