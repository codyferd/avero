const { createApp, ref, computed, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const canvasWidth = ref(800);
        const canvasHeight = ref(600);

        const tools = ref([
            { id: 'brush', name: 'Precision Paintbrush', icon: '🖌️' },
            { id: 'select', name: 'Selection & Move Frame', icon: '⬈' },
            { id: 'text', name: 'Typography Text Insert', icon: ' Hardy 🔤', label: 'text' },
            { id: 'line', name: 'Vector Line Segment', icon: '📏', label: 'line' },
            { id: 'rect', name: 'Rectangle Frame Tool', icon: '⬜', label: 'rect' },
            { id: 'ellipse', name: 'Circle Ellipse Vector', icon: '⭕', label: 'oval' },
            { id: 'bucket', name: 'Flood Paint Bucket', icon: '🪣' },
            { id: 'pipette', name: 'Eye-dropper Sample Color', icon: '🧪', label: 'drop' },
            { id: 'eraser', name: 'Pixel Eraser', icon: '🧽' }
        ]);
        
        const currentTool = ref('brush');
        const brushColor = ref('#ec4899');
        const brushSize = ref(10);
        const brushOpacity = ref(100);

        // Text input variables
        const textString = ref('Avero Paint');
        const textFont = ref('sans-serif');

        // Viewport Matrix Transforms State nodes
        const zoomScale = ref(1.0);
        const panX = ref(0);
        const panY = ref(0);

        const layers = ref([]);
        const activeLayerId = ref(null);
        
        const isDrawing = ref(false);
        const startCoords = ref({ x: 0, y: 0 });
        const lastX = ref(0);
        const lastY = ref(0);

        // Undo & Redo History Buffers Configuration Stacks
        const undoStack = ref([]);
        const redoStack = ref([]);

        // Interactive Selection Context State
        const selectionBox = ref(null); 
        const isManipulatingSelection = ref(false);

        const reversedLayers = computed(() => [...layers.value].reverse());
        const canUndo = computed(() => undoStack.value.length > 0);
        const canRedo = computed(() => redoStack.value.length > 0);

        const getActualLayerIndex = (id) => layers.value.findIndex(l => l.id === id);

        const activeCtx = () => {
            if (!activeLayerId.value) return null;
            const el = document.getElementById('layer-' + activeLayerId.value);
            return el ? el.getContext('2d') : null;
        };

        const setTool = (toolId) => {
            currentTool.value = toolId;
            clearSelectionOverlay();
        };

        const setActiveLayer = (id) => {
            activeLayerId.value = id;
            clearSelectionOverlay();
        };

        const saveHistoryState = () => {
            redoStack.value = [];
            const stateSnapshot = layers.value.map(layer => {
                const canvas = document.getElementById('layer-' + layer.id);
                return {
                    id: layer.id,
                    name: layer.name,
                    visible: layer.visible,
                    dataUrl: canvas ? canvas.toDataURL() : null
                };
            });
            undoStack.value.push(JSON.stringify(stateSnapshot));
            if (undoStack.value.length > 25) undoStack.value.shift();
        };

        const undo = () => {
            if (!canUndo.value) return;
            const currentSnapshot = layers.value.map(layer => {
                const canvas = document.getElementById('layer-' + layer.id);
                return { id: layer.id, name: layer.name, visible: layer.visible, dataUrl: canvas ? canvas.toDataURL() : null };
            });
            redoStack.value.push(JSON.stringify(currentSnapshot));

            const targetState = JSON.parse(undoStack.value.pop());
            restoreStatePack(targetState);
        };

        const redo = () => {
            if (!canRedo.value) return;
            const currentSnapshot = layers.value.map(layer => {
                const canvas = document.getElementById('layer-' + layer.id);
                return { id: layer.id, name: layer.name, visible: layer.visible, dataUrl: canvas ? canvas.toDataURL() : null };
            });
            undoStack.value.push(JSON.stringify(currentSnapshot));

            const targetState = JSON.parse(redoStack.value.pop());
            restoreStatePack(targetState);
        };

        const restoreStatePack = (statePack) => {
            layers.value = statePack.map(s => ({ id: s.id, name: s.name, visible: s.visible }));
            clearSelectionOverlay();
            
            nextTick(() => {
                statePack.forEach(s => {
                    const canvas = document.getElementById('layer-' + s.id);
                    if (canvas) {
                        canvas.width = canvasWidth.value;
                        canvas.height = canvasHeight.value;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        if (s.dataUrl) {
                            const img = new Image();
                            img.onload = () => ctx.drawImage(img, 0, 0);
                            img.src = s.dataUrl;
                        }
                    }
                });
            });
        };

        const handleZoomWheel = (e) => {
            const zoomFactor = 1.1;
            if (e.deltaY < 0) {
                if (zoomScale.value < 10) zoomScale.value = parseFloat((zoomScale.value * zoomFactor).toFixed(2));
            } else {
                if (zoomScale.value > 0.15) zoomScale.value = parseFloat((zoomScale.value / zoomFactor).toFixed(2));
            }
        };

        const resetViewport = () => {
            zoomScale.value = 1.0;
            panX.value = 0;
            panY.value = 0;
        };

        const addNewLayer = () => {
            saveHistoryState();
            const id = Date.now();
            const num = layers.value.length + 1;
            layers.value.push({ id, name: `Layer ${num}`, visible: true });
            activeLayerId.value = id;

            nextTick(() => {
                const canvas = document.getElementById('layer-' + id);
                if (canvas) {
                    canvas.width = canvasWidth.value;
                    canvas.height = canvasHeight.value;
                    const ctx = canvas.getContext('2d');
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
                updateInteractionCanvasDimensions();
            });
        };

        const deleteLayer = (id) => {
            if (layers.value.length <= 1) return;
            saveHistoryState();
            const idx = getActualLayerIndex(id);
            layers.value.splice(idx, 1);
            if (activeLayerId.value === id) {
                activeLayerId.value = layers.value[layers.value.length - 1].id;
            }
        };

        const moveLayerOrder = (index, direction) => {
            saveHistoryState();
            if (direction === 'up' && index < layers.value.length - 1) {
                const temp = layers.value[index];
                layers.value[index] = layers.value[index + 1];
                layers.value[index + 1] = temp;
            } else if (direction === 'down' && index > 0) {
                const temp = layers.value[index];
                layers.value[index] = layers.value[index - 1];
                layers.value[index - 1] = temp;
            }
        };

        const clearCurrentLayer = () => {
            saveHistoryState();
            const ctx = activeCtx();
            if (ctx) ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        };

        const resetEntireCanvas = () => {
            undoStack.value = [];
            redoStack.value = [];
            layers.value = [];
            resetViewport();
            addNewLayer();
        };

        const getCoordinates = (e) => {
            const wrapper = document.getElementById('canvas-view-wrapper');
            const rect = wrapper.getBoundingClientRect();
            
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const x = ((clientX - rect.left) / rect.width) * canvasWidth.value;
            const y = ((clientY - rect.top) / rect.height) * canvasHeight.value;
            return { x: Math.round(x), y: Math.round(y), rawX: clientX, rawY: clientY };
        };

        const canvasStartPointer = (e) => {
            const coords = getCoordinates(e);

            if (e.button === 2 || e.button === 1 || currentTool.value === 'select' && !selectionBox.value) {
                isDrawing.value = false;
                isManipulatingSelection.value = true;
                lastX.value = coords.rawX;
                lastY.value = coords.rawY;
                return;
            }

            if (currentTool.value === 'pipette') {
                sampleCanvasColor(coords.x, coords.y);
                return;
            }

            if (currentTool.value === 'select' && selectionBox.value) {
                const x = coords.x; const y = coords.y;
                const s = selectionBox.value;
                if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
                    s.isMoving = true;
                    lastX.value = x;
                    lastY.value = y;
                    saveHistoryState();
                    return;
                } else {
                    clearSelectionOverlay();
                }
            }

            if (currentTool.value === 'select') {
                selectionBox.value = { x: coords.x, y: coords.y, w: 0, h: 0, isSelecting: true };
                return;
            }

            const ctx = activeCtx();
            const currentLayer = layers.value.find(l => l.id === activeLayerId.value);
            if (!ctx || (currentLayer && !currentLayer.visible)) return;

            saveHistoryState();
            isDrawing.value = true;
            startCoords.value = { x: coords.x, y: coords.y };
            lastX.value = coords.x;
            lastY.value = coords.y;

            if (currentTool.value === 'bucket') {
                floodFill(coords.x, coords.y, brushColor.value);
                isDrawing.value = false;
            } else if (currentTool.value === 'text') {
                insertTypographyText(coords.x, coords.y);
                isDrawing.value = false;
            } else if (currentTool.value === 'brush' || currentTool.value === 'eraser') {
                drawSegment(coords.x, coords.y, coords.x, coords.y);
            }
        };

        const canvasMovePointer = (e) => {
            const coords = getCoordinates(e);

            if (isManipulatingSelection.value) {
                panX.value += coords.rawX - lastX.value;
                panY.value += coords.rawY - lastY.value;
                lastX.value = coords.rawX;
                lastY.value = coords.rawY;
                return;
            }

            if (selectionBox.value?.isSelecting) {
                const s = selectionBox.value;
                s.w = coords.x - s.x;
                s.h = coords.y - s.y;
                drawSelectionMarquee();
                return;
            }

            if (selectionBox.value?.isMoving) {
                const s = selectionBox.value;
                const dx = Math.round(coords.x - lastX.value);
                const dy = Math.round(coords.y - lastY.value);
                
                if (!s.clipboardBuffer) {
                    const layerCanvas = document.getElementById('layer-' + activeLayerId.value);
                    const layerCtx = layerCanvas.getContext('2d');
                    const clipCanvas = document.createElement('canvas');
                    clipCanvas.width = Math.abs(s.w);
                    clipCanvas.height = Math.abs(s.h);
                    const clipCtx = clipCanvas.getContext('2d');
                    
                    const sourceX = s.w < 0 ? s.x + s.w : s.x;
                    const sourceY = s.h < 0 ? s.y + s.h : s.y;
                    const boxW = Math.abs(s.w);
                    const boxH = Math.abs(s.h);

                    if (boxW > 0 && boxH > 0) {
                        clipCtx.drawImage(layerCanvas, sourceX, sourceY, boxW, boxH, 0, 0, boxW, boxH);
                        s.clipboardBuffer = clipCanvas;
                        s.x = sourceX; s.y = sourceY; s.w = boxW; s.h = boxH;
                        layerCtx.clearRect(sourceX, sourceY, boxW, boxH);
                    }
                }

                if (s.clipboardBuffer) {
                    s.x += dx; s.y += dy;
                    lastX.value = coords.x; lastY.value = coords.y;
                    renderSelectionMoveState();
                }
                return;
            }

            if (!isDrawing.value) return;

            if (['line', 'rect', 'ellipse'].includes(currentTool.value)) {
                renderLiveShapePreview(coords.x, coords.y);
            } else {
                drawSegment(lastX.value, lastY.value, coords.x, coords.y);
                lastX.value = coords.x;
                lastY.value = coords.y;
            }
        };

        const canvasEndPointer = (e) => {
            const coords = getCoordinates(e || {});
            
            if (isDrawing.value && ['line', 'rect', 'ellipse'].includes(currentTool.value)) {
                commitShapeToCanvas(lastX.value, lastY.value);
            }

            isDrawing.value = false;
            isManipulatingSelection.value = false;

            if (selectionBox.value?.isSelecting) {
                selectionBox.value.isSelecting = false;
                if (Math.abs(selectionBox.value.w) < 4 || Math.abs(selectionBox.value.h) < 4) {
                    clearSelectionOverlay();
                } else {
                    drawSelectionMarquee();
                }
            }
            if (selectionBox.value?.isMoving) {
                selectionBox.value.isMoving = false;
                finalizeSelectionPlacement();
            }
        };

        const drawSegment = (x1, y1, x2, y2) => {
            const ctx = activeCtx();
            if (!ctx) return;

            ctx.save();
            ctx.globalAlpha = brushOpacity.value / 100;

            if (currentTool.value === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = brushColor.value;
            }

            ctx.lineWidth = brushSize.value;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        };

        // Live preview configurations
        const renderLiveShapePreview = (currentX, currentY) => {
            const canvas = document.getElementById('interaction-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

            ctx.save();
            ctx.globalAlpha = brushOpacity.value / 100;
            ctx.strokeStyle = brushColor.value;
            ctx.lineWidth = brushSize.value;
            ctx.lineCap = 'round';

            const sx = startCoords.value.x;
            const sy = startCoords.value.y;

            ctx.beginPath();
            if (currentTool.value === 'line') {
                ctx.moveTo(sx, sy);
                ctx.lineTo(currentX, currentY);
            } else if (currentTool.value === 'rect') {
                ctx.strokeRect(sx, sy, currentX - sx, currentY - sy);
            } else if (currentTool.value === 'ellipse') {
                const rx = Math.abs(currentX - sx) / 2;
                const ry = Math.abs(currentY - sy) / 2;
                const cx = sx + (currentX - sx) / 2;
                const cy = sy + (currentY - sy) / 2;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            }
            ctx.stroke();
            ctx.restore();

            lastX.value = currentX;
            lastY.value = currentY;
        };

        const commitShapeToCanvas = (targetX, targetY) => {
            const ctx = activeCtx();
            if (!ctx) return;

            ctx.save();
            ctx.globalAlpha = brushOpacity.value / 100;
            ctx.strokeStyle = brushColor.value;
            ctx.lineWidth = brushSize.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const sx = startCoords.value.x;
            const sy = startCoords.value.y;

            ctx.beginPath();
            if (currentTool.value === 'line') {
                ctx.moveTo(sx, sy);
                ctx.lineTo(targetX, targetY);
            } else if (currentTool.value === 'rect') {
                ctx.strokeRect(sx, sy, targetX - sx, targetY - sy);
            } else if (currentTool.value === 'ellipse') {
                const rx = Math.abs(targetX - sx) / 2;
                const ry = Math.abs(targetY - sy) / 2;
                const cx = sx + (targetX - sx) / 2;
                const cy = sy + (targetY - sy) / 2;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            }
            ctx.stroke();
            ctx.restore();

            const iCanvas = document.getElementById('interaction-canvas');
            if (iCanvas) iCanvas.getContext('2d').clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        };

        const insertTypographyText = (x, y) => {
            const ctx = activeCtx();
            if (!ctx || !textString.value) return;

            ctx.save();
            ctx.globalAlpha = brushOpacity.value / 100;
            ctx.fillStyle = brushColor.value;
            ctx.font = `${brushSize.value * 2}px ${textFont.value}`;
            ctx.textBaseline = 'top';
            ctx.fillText(textString.value, x, y);
            ctx.restore();
        };

        const sampleCanvasColor = (x, y) => {
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = canvasWidth.value; mergedCanvas.height = canvasHeight.value;
            const mCtx = mergedCanvas.getContext('2d');

            layers.value.forEach(layer => {
                if (layer.visible) {
                    const canvas = document.getElementById('layer-' + layer.id);
                    if (canvas) mCtx.drawImage(canvas, 0, 0);
                }
            });

            const imgData = mCtx.getImageData(x, y, 1, 1).data;
            if (imgData[3] > 0) {
                const hex = "#" + ("000000" + ((imgData[0] << 16) | (imgData[1] << 8) | imgData[2]).toString(16)).slice(-6);
                brushColor.value = hex;
                currentTool.value = 'brush';
            }
        };

        const drawSelectionMarquee = () => {
            const canvas = document.getElementById('interaction-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

            if (!selectionBox.value) return;
            const s = selectionBox.value;

            ctx.save();
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2 / zoomScale.value;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(s.x, s.y, s.w, s.h);
            ctx.restore();
        };

        const renderSelectionMoveState = () => {
            drawSelectionMarquee();
            const s = selectionBox.value;
            if (!s?.clipboardBuffer) return;

            const canvas = document.getElementById('interaction-canvas');
            const ctx = canvas.getContext('2d');
            ctx.drawImage(s.clipboardBuffer, s.x, s.y);
        };

        const finalizeSelectionPlacement = () => {
            const s = selectionBox.value;
            if (!s?.clipboardBuffer) return;

            const ctx = activeCtx();
            if (ctx) {
                ctx.save();
                ctx.drawImage(s.clipboardBuffer, s.x, s.y);
                ctx.restore();
            }
            s.clipboardBuffer = null;
            drawSelectionMarquee();
        };

        const clearSelectionOverlay = () => {
            selectionBox.value = null;
            const canvas = document.getElementById('interaction-canvas');
            if (canvas) canvas.getContext('2d').clearRect(0, 0, canvasWidth.value, canvasHeight.value);
        };

        const updateInteractionCanvasDimensions = () => {
            const canvas = document.getElementById('interaction-canvas');
            if (canvas) {
                canvas.width = canvasWidth.value;
                canvas.height = canvasHeight.value;
            }
        };

        const parseHexColor = (hexStr) => {
            let c = hexStr.replace('#', '');
            if (c.length === 3) c = c.split('').map(s => s + s).join('');
            return { r: parseInt(c.substr(0, 2), 16), g: parseInt(c.substr(2, 2), 16), b: parseInt(c.substr(4, 2), 16), a: 255 };
        };

        const floodFill = (startX, startY, fillHex) => {
            const canvas = document.getElementById('layer-' + activeLayerId.value);
            const ctx = canvas.getContext('2d');
            
            startX = Math.floor(startX); startY = Math.floor(startY);
            if (startX < 0 || startX >= canvasWidth.value || startY < 0 || startY >= canvasHeight.value) return;

            const imgData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
            const data = imgData.data;
            
            const targetColor = parseHexColor(fillHex);
            const startIdx = (startY * canvasWidth.value + startX) * 4;
            
            const startR = data[startIdx]; const startG = data[startIdx + 1];
            const startB = data[startIdx + 2]; const startA = data[startIdx + 3];

            if (Math.abs(startR - targetColor.r) < 2 && Math.abs(startG - targetColor.g) < 2 && Math.abs(startB - targetColor.b) < 2 && Math.abs(startA - targetColor.a) < 2) return;

            const queue = [[startX, startY]];
            while (queue.length > 0) {
                const [cx, cy] = queue.pop();
                let idx = (cy * canvasWidth.value + cx) * 4;

                if (cx >= 0 && cx < canvasWidth.value && cy >= 0 && cy < canvasHeight.value && data[idx] === startR && data[idx + 1] === startG && data[idx + 2] === startB && data[idx + 3] === startA) {
                    data[idx] = targetColor.r; data[idx + 1] = targetColor.g; data[idx + 2] = targetColor.b; data[idx + 3] = targetColor.a;
                    queue.push([cx + 1, cy]); queue.push([cx - 1, cy]); queue.push([cx, cy + 1]); queue.push([cx, cy - 1]);
                }
            }
            ctx.putImageData(imgData, 0, 0);
        };

        const exportPng = () => {
            clearSelectionOverlay();
            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = canvasWidth.value; mergedCanvas.height = canvasHeight.value;
            const mCtx = mergedCanvas.getContext('2d');

            layers.value.forEach(layer => {
                if (layer.visible) {
                    const canvas = document.getElementById('layer-' + layer.id);
                    if (canvas) mCtx.drawImage(canvas, 0, 0);
                }
            });

            const link = document.createElement('a');
            link.href = mergedCanvas.toDataURL('image/png');
            link.download = `avero-artwork-${Date.now()}.png`;
            link.click();
        };

        const exportLayersJs = () => {
            clearSelectionOverlay();
            const exportPack = layers.value.map(layer => {
                const canvas = document.getElementById('layer-' + layer.id);
                return { name: layer.name, visible: layer.visible, dataUrl: canvas ? canvas.toDataURL() : '' };
            });

            const fileContent = `const AVERO_ARTWORK = ${JSON.stringify(exportPack, null, 2)};`;
            const blob = new Blob([fileContent], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url; link.download = `avero-canvas-${Date.now()}.js`;
            link.click();
            URL.revokeObjectURL(url);
        };

        const triggerImport = () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.js';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const txt = evt.target.result;
                        const jsonString = txt.replace(/const\s+AVERO_ARTWORK\s*=\s*/, '').replace(/;$/, '').trim();
                        const parsed = JSON.parse(jsonString);

                        if (Array.isArray(parsed)) {
                            undoStack.value = []; redoStack.value = [];
                            layers.value = [];
                            parsed.forEach((savedLayer, i) => {
                                const id = Date.now() + i;
                                layers.value.push({ id, name: savedLayer.name, visible: savedLayer.visible });

                                nextTick(() => {
                                    const canvas = document.getElementById('layer-' + id);
                                    if (canvas) {
                                        canvas.width = canvasWidth.value; canvas.height = canvasHeight.value;
                                        const ctx = canvas.getContext('2d');
                                        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                                        if (savedLayer.dataUrl) {
                                            const img = new Image();
                                            img.onload = () => ctx.drawImage(img, 0, 0);
                                            img.src = savedLayer.dataUrl;
                                        }
                                    }
                                    if (i === parsed.length - 1) updateInteractionCanvasDimensions();
                                });
                            });
                            activeLayerId.value = layers.value[layers.value.length - 1].id;
                        }
                    } catch (err) {
                        alert("Malformed paint structural map asset.");
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };

        const handleGlobalShortcuts = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault(); undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault(); redo();
            }
        };

        onMounted(() => {
            addNewLayer();
            window.addEventListener('keydown', handleGlobalShortcuts);
        });

        return {
            canvasWidth, canvasHeight, tools, currentTool, brushColor, brushSize, brushOpacity,
            textString, textFont, layers, activeLayerId, reversedLayers, getActualLayerIndex, zoomScale, panX, panY,
            canUndo, canRedo, setTool, setActiveLayer, addNewLayer, deleteLayer, moveLayerOrder, 
            clearCurrentLayer, resetEntireCanvas, canvasStartPointer, canvasMovePointer, canvasEndPointer,
            handleZoomWheel, resetViewport, undo, redo, exportPng, exportLayersJs, triggerImport
        };
    }
}).mount('#app');
