const { createApp } = Vue;

createApp({
    data() {
        return {
            vueMode: false, // Core component view layout structural switcher flag
            docSettings: {
                background: '#09090b',
                title: 'Avero Enhanced Document Structure Object'
            },
            elements: [],
            selectedElement: null
        };
    },
    computed: {
        // Advanced Reading Analytics Engine Platform Telemetry 
        readingMetrics() {
            let totalWords = 0;
            let totalChars = 0;

            this.elements.forEach(el => {
                if (el.type !== 'image' && el.content) {
                    const cleanedText = el.content.trim();
                    if (cleanedText.length > 0) {
                        totalWords += cleanedText.split(/\s+/).filter(w => w.length > 0).length;
                        totalChars += cleanedText.length;
                    }
                }
            });

            // Calculates expected text execution processing parameters (standard baseline ~200 WPM metric)
            const calculatedMinutes = Math.ceil(totalWords / 200);

            return {
                words: totalWords,
                chars: totalChars,
                time: totalWords === 0 ? 0 : calculatedMinutes
            };
        }
    },
    methods: {
        // Element Generation Factory Container Matrix
        addElement(type) {
            const id = Date.now();
            let newElement = {
                id: id,
                type: type,
                align: 'left'
            };

            if (type === 'heading') {
                newElement.content = 'New Content Section Header';
                newElement.fontSize = 24;
                newElement.color = '#ffffff';
            } else if (type === 'paragraph') {
                newElement.content = 'Click to add block text string information into this node.';
                newElement.fontSize = 15;
                newElement.color = '#a1a1aa';
            } else if (type === 'blockquote') {
                newElement.content = 'High emphasis analytical quote summary point statement.';
                newElement.fontSize = 14;
                newElement.color = '#d1d1d6';
            } else if (type === 'image') {
                // Initialize default picture asset template attributes 
                newElement.contentUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800';
                newElement.widthPercent = 80;
                newElement.radius = 8;
            }

            this.elements.push(newElement);
            this.selectedElement = newElement;
        },
        deleteElement(id) {
            this.elements = this.elements.filter(el => el.id !== id);
            if (this.selectedElement && this.selectedElement.id === id) {
                this.selectedElement = null;
            }
        },
        // Feature Addition: Clone specific block configuration maps explicitly 
        duplicateElement(element) {
            const clonedNode = JSON.parse(JSON.stringify(element));
            clonedNode.id = Date.now(); // Updates assignment reference context parameters tracking fields
            
            const findIndex = this.elements.findIndex(el => el.id === element.id);
            if (findIndex !== -1) {
                this.elements.splice(findIndex + 1, 0, clonedNode);
                this.selectedElement = clonedNode;
            }
        },
        moveElement(id, direction) {
            const currentIndex = this.elements.findIndex(el => el.id === id);
            if (currentIndex === -1) return;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= this.elements.length) return;

            const elementToMove = this.elements[currentIndex];
            this.elements.splice(currentIndex, 1);
            this.elements.splice(targetIndex, 0, elementToMove);
        },
        // Feature Addition: Batch palette style theme injection matrix
        applyThemePreset(themeKey) {
            const palettes = {
                pitch: { bg: '#000000', fontColor: '#ffffff', paraColor: '#a1a1aa' },
                cyber: { bg: '#0c0a09', fontColor: '#f59e0b', paraColor: '#d6d3d1' },
                ocean: { bg: '#020617', fontColor: '#38bdf8', paraColor: '#94a3b8' },
                nordic: { bg: '#0f172a', fontColor: '#e2e8f0', paraColor: '#cbd5e1' }
            };

            if (palettes[themeKey]) {
                const currentPalette = palettes[themeKey];
                this.docSettings.background = currentPalette.bg;
                
                // Iteratively normalizes text subcategories matching active choice profiles
                this.elements.forEach(el => {
                    if (el.type === 'heading') el.color = currentPalette.fontColor;
                    if (el.type === 'paragraph') el.color = currentPalette.paraColor;
                });
            }
        },
        autoResizeTextarea(event) {
            const el = event.target;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        },
        handleExport() {
            const packoutData = {
                settings: this.docSettings,
                elements: this.elements
            };
            window.AveroDocExporter.exportToJsFile(packoutData);
        },
        triggerImport() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const parsedData = window.AveroDocExporter.importFromJsText(evt.target.result);
                    if (parsedData && parsedData.settings && Array.isArray(parsedData.elements)) {
                        this.docSettings = parsedData.settings;
                        this.elements = parsedData.elements;
                        this.selectedElement = null;
                        this.vueMode = false;
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    }
}).mount('#app');

/**
 * Isolated Global System Exporter and Importer Module Object Engine Blueprint
 * Explicitly structures output strings matching the assignment const syntax rules.
 */
window.AveroDocExporter = {
    exportToJsFile: function(documentData) {
        const dataString = JSON.stringify(documentData, null, 2);
        const fileContent = `const AVERO_DOCUMENT = ${dataString};`;
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `avero-doc-${Date.now()}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    importFromJsText: function(fileText) {
        try {
            // Find where the JSON data actually starts and ends, bypassing assignment syntax wrappers and external comments cleanly
            const startAssignmentIdx = fileText.indexOf('const AVERO_DOCUMENT =');
            if (startAssignmentIdx === -1) {
                throw new Error("Invalid format: Missing AVERO_DOCUMENT token declaration syntax.");
            }

            // Slice out the content starting after the assignment operator symbol '='
            let extractionZone = fileText.substring(startAssignmentIdx);
            let jsonString = extractionZone.replace(/const\s+AVERO_DOCUMENT\s*=\s*/, '').trim();

            // Strip away the absolute trailing semicolon if present
            if (jsonString.endsWith(';')) {
                jsonString = jsonString.slice(0, -1).trim();
            }
                
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Export parser runtime failure: ", e);
            alert("Malformed configurations file runtime error. Failed parsing file structure template data.");
            return null;
        }
    }
};
