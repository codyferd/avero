/**
 * Avero Web Studio Engine - Extended File Serialization & Presentation Sandboxing Core
 */
(() => {
    const { createApp, ref, onMounted, onUnmounted } = Vue;

    createApp({
        setup() {
            const documentTitle = ref("");
            const streamBlocks = ref([]);
            
            // Execution Environment Controls
            const isPresentationMode = ref(false);
            
            // Native IO Bridge Hardware Pointers
            const fileInputBridge = ref(null);

            // Establish Global Key Handlers for Presentation Modes
            const globalKeydownInterceptor = (event) => {
                if (event.key === "Escape" && isPresentationMode.value) {
                    isPresentationMode.value = false;
                }
            };

            onMounted(() => {
                window.addEventListener("keydown", globalKeydownInterceptor);
            });

            onUnmounted(() => {
                window.removeEventListener("keydown", globalKeydownInterceptor);
            });

            const togglePresentationMode = () => {
                isPresentationMode.value = !isPresentationMode.value;
            };

            /**
             * SERIALIZATION GATEWAY ENGINE - EXPORT TO NATIVE DISK .JS FILE
             */
            const exportToJsFile = () => {
                const packagePayload = {
                    title: documentTitle.value || "Untitled Published Build Layout",
                    schemaVersion: "4.0.0",
                    timestamp: new Date().toISOString(),
                    stream: streamBlocks.value
                };

                const finalScriptOutput = `/**\n * Avero Web Studio Published Engine Artifact\n * Generated: ${packagePayload.timestamp}\n */\nconst averoStudioProjectData = ${JSON.stringify(packagePayload, null, 4)};\n`;
                
                const virtualBlob = new Blob([finalScriptOutput], { type: "application/javascript;charset=utf-8;" });
                const transientAnchor = document.createElement("a");
                
                const systemFileName = (documentTitle.value || "untitled-studio-build")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                transientAnchor.href = URL.createObjectURL(virtualBlob);
                transientAnchor.download = `${systemFileName || 'avero-release'}.js`;
                
                document.body.appendChild(transientAnchor);
                transientAnchor.click();
                document.body.removeChild(transientAnchor);
            };

            /**
             * PARSING INTERCEPTOR MODULE - IMPORT DIRECT FROM LOCAL .JS FILE
             */
            const triggerFileImport = () => {
                if (fileInputBridge.value) {
                    fileInputBridge.value.click();
                }
            };

            const handleFileChange = (event) => {
                const targetedDiskAsset = event.target.files[0];
                if (!targetedDiskAsset) return;

                const fileReaderEngine = new FileReader();
                fileReaderEngine.onload = (fileLoadedEvent) => {
                    let evaluationString = fileLoadedEvent.target.result.trim();
                    
                    try {
                        if (evaluationString.includes("const averoStudioProjectData =")) {
                            evaluationString = evaluationString.split("const averoStudioProjectData =")[1].trim();
                        } else if (evaluationString.includes("=")) {
                            evaluationString = evaluationString.substring(evaluationString.indexOf("=") + 1).trim();
                        }
                        
                        if (evaluationString.endsWith(";")) {
                            evaluationString = evaluationString.slice(0, -1).trim();
                        }

                        const structuredModelJson = JSON.parse(evaluationString);
                        
                        if (structuredModelJson && Array.isArray(structuredModelJson.stream)) {
                            documentTitle.value = structuredModelJson.title || "Imported Project Blueprint";
                            streamBlocks.value = structuredModelJson.stream;
                        } else {
                            alert("Format Collision: Asset target lacks expected Avero architecture matrices.");
                        }
                    } catch (parserException) {
                        alert("Compilation Failure: Unable to compute runtime object arrays.");
                        console.error(parserException);
                    }
                    event.target.value = "";
                };
                fileReaderEngine.readAsText(targetedDiskAsset);
            };

            const addBlock = (type) => {
                const blockId = "block_" + Date.now() + Math.floor(Math.random() * 100);
                
                if (type === 'document') {
                    streamBlocks.value.push({
                        id: blockId,
                        type,
                        content: [{ type: "paragraph", text: "" }]
                    });
                } else if (type === 'sheet') {
                    const defaultCells = {};
                    for (let r = 1; r <= 3; r++) {
                        for (let c = 1; c <= 3; c++) {
                            defaultCells[`${String.fromCharCode(64 + c)}${r}`] = { value: "", isEditing: false };
                        }
                    }
                    streamBlocks.value.push({
                        id: blockId,
                        type,
                        rows: 3,
                        cols: 3,
                        cells: defaultCells
                    });
                } else if (type === 'presentation') {
                    streamBlocks.value.push({
                        id: blockId,
                        type,
                        activeSlideIndex: 0,
                        slides: []
                    });
                }
            };

            const addTextNode = (block, type) => {
                if (type === 'checklist') {
                    block.content.push({ type, text: "", checked: false });
                } else if (type === 'image') {
                    block.content.push({ type, url: "", caption: "" });
                } else if (type === 'embed') {
                    block.content.push({ type, url: "" });
                } else if (type === 'callout') {
                    block.content.push({ type, icon: "💡", text: "" });
                } else {
                    block.content.push({ type, text: "" });
                }
            };

            const cleanEmbedUrl = (node) => {
                if (!node.url) return;
                if (node.url.includes("youtube.com/watch?v=")) {
                    node.url = node.url.replace("watch?v=", "embed/");
                } else if (node.url.includes("youtu.be/")) {
                    const videoId = node.url.split("/").pop();
                    node.url = `https://www.youtube.com/embed/${videoId}`;
                }
            };

            const autoGrowTextarea = (event) => {
                const el = event.target;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
            };

            const getColumnLetter = (colIndex) => String.fromCharCode(64 + colIndex);
            const getCellCoords = (c, r) => `${getColumnLetter(c)}${r}`;

            const alterMatrixSize = (block, axis, count) => {
                if (axis === 'row') {
                    block.rows += count;
                    for (let c = 1; c <= block.cols; c++) {
                        block.cells[`${getColumnLetter(c)}${block.rows}`] = { value: "", isEditing: false };
                    }
                } else if (axis === 'col') {
                    block.cols += count;
                    for (let r = 1; r <= block.rows; r++) {
                        block.cells[`${getColumnLetter(block.cols)}${r}`] = { value: "", isEditing: false };
                    }
                }
            };

            const evaluateFormula = (valString, cellStateMatrix) => {
                if (!valString || !valString.toUpperCase().startsWith('=')) return valString;
                try {
                    const formulaClean = valString.toUpperCase().replace('=', '').trim();
                    const matchParts = formulaClean.match(/(SUM|AVG)\(([A-Z][1-9]\d*):([A-Z][1-9]\d*)\)/);
                    
                    if (!matchParts) return "#SYNTAX_ERR";
                    
                    const operation = matchParts[1];
                    const startCell = matchParts[2];
                    const endCell = matchParts[3];

                    const startCol = startCell.charCodeAt(0) - 64;
                    const startRow = parseInt(startCell.slice(1), 10);
                    const endCol = endCell.charCodeAt(0) - 64;
                    const endRow = parseInt(endCell.slice(1), 10);

                    let extractedNumbers = [];
                    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
                        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
                            const coords = `${String.fromCharCode(64 + c)}${r}`;
                            const cVal = parseFloat(cellStateMatrix[coords]?.value || 0);
                            if (!isNaN(cVal)) extractedNumbers.push(cVal);
                        }
                    }

                    if (extractedNumbers.length === 0) return 0;
                    const totalSum = extractedNumbers.reduce((acc, curr) => acc + curr, 0);
                    
                    if (operation === 'SUM') return totalSum;
                    if (operation === 'AVG') return (totalSum / extractedNumbers.length).toFixed(2);
                    
                    return "#OP_ERR";
                } catch (err) {
                    return "#MATH_ERR";
                }
            };

            const appendBlankSlide = (block) => {
                block.slides.push({
                    format: "spotlight",
                    title: "",
                    body: "",
                    splitTitleRight: "",
                    splitBodyRight: "",
                    metricValue: "",
                    mediaUrl: "",
                    bg: "#0f172a",
                    textColor: "#ffffff"
                });
                block.activeSlideIndex = block.slides.length - 1;
            };

            const removeActiveSlide = (block) => {
                if (block.slides.length === 0) return;
                block.slides.splice(block.activeSlideIndex, 1);
                block.activeSlideIndex = Math.max(0, block.activeSlideIndex - 1);
            };

            const moveBlock = (index, shiftDirection) => {
                const targetPos = index + shiftDirection;
                if (targetPos < 0 || targetPos >= streamBlocks.value.length) return;
                const elementToShift = streamBlocks.value.splice(index, 1)[0];
                streamBlocks.value.splice(targetPos, 0, elementToShift);
            };

            const deleteBlock = (index) => {
                streamBlocks.value.splice(index, 1);
            };

            const getBlockIcon = (type) => {
                if (type === 'document') return '📝';
                if (type === 'sheet') return '📊';
                if (type === 'presentation') return '📽️';
                return '📄';
            };

            return {
                documentTitle, streamBlocks, isPresentationMode, fileInputBridge,
                togglePresentationMode, exportToJsFile, triggerFileImport, handleFileChange,
                addBlock, addTextNode, cleanEmbedUrl, autoGrowTextarea, getColumnLetter, getCellCoords,
                alterMatrixSize, evaluateFormula, appendBlankSlide, removeActiveSlide,
                moveBlock, deleteBlock, getBlockIcon
            };
        }
    }).mount('#app');
})();
