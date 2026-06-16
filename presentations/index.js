const { createApp } = Vue;

createApp({
    data() {
        return {
            slides: [
                {
                    id: 1,
                    background: '#000000',
                    elements: [
                        { id: 101, type: 'text', content: 'Avero Dark Presentation Module', top: 60, left: 160, fontSize: 42, width: 600, height: 120, color: '#ffffff', zIndex: 3 },
                        { id: 102, type: 'text', content: 'Press Play to preview the distraction-free workspace layout safely.', top: 200, left: 160, fontSize: 18, width: 500, height: 60, color: '#a1a1aa', zIndex: 2 },
                        { id: 103, type: 'shape', width: 640, height: 4, radius: 2, color: '#f59e0b', top: 280, left: 160, zIndex: 1 }
                    ]
                }
            ],
            currentSlideIndex: 0,
            selectedElement: null,
            presentationMode: false,
            isDragging: false,
            dragTarget: null,
            dragOffset: { x: 0, y: 0 }
        };
    },
    computed: {
        currentSlide() {
            return this.slides[this.currentSlideIndex] || null;
        }
    },
    mounted() {
        window.addEventListener('keydown', this.handleGlobalKeydowns);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleGlobalKeydowns);
    },
    methods: {
        addSlide() {
            const newId = Date.now();
            this.slides.push({
                id: newId,
                background: '#000000',
                elements: [
                    { id: Date.now() + 1, type: 'text', content: 'New Workspace Header', top: 60, left: 100, fontSize: 32, width: 500, height: 80, color: '#ffffff', zIndex: 1 }
                ]
            });
            this.currentSlideIndex = this.slides.length - 1;
        },
        deleteSlide(index) {
            if (this.slides.length <= 1) return;
            this.slides.splice(index, 1);
            if (this.currentSlideIndex >= this.slides.length) {
                this.currentSlideIndex = this.slides.length - 1;
            }
        },
        addElement(type) {
            if (!this.currentSlide) return;
            
            const maxZ = this.currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 0);

            const baseElement = {
                id: Date.now(),
                type: type,
                top: 150,
                left: 200,
                zIndex: maxZ + 1
            };

            if (type === 'text') {
                baseElement.content = 'Editable text box lines container';
                baseElement.fontSize = 24;
                baseElement.width = 350; // Custom baseline container structural width
                baseElement.height = 100; // Custom baseline container structural height
                baseElement.color = '#ffffff';
            } else if (type === 'image') {
                baseElement.content = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
            } else if (type === 'shape') {
                baseElement.width = 150;
                baseElement.height = 150;
                baseElement.color = '#3b82f6';
                baseElement.radius = 8;
            }

            this.currentSlide.elements.push(baseElement);
            this.selectedElement = baseElement;
        },
        deleteElement() {
            if (!this.selectedElement || !this.currentSlide) return;
            this.currentSlide.elements = this.currentSlide.elements.filter(el => el.id !== this.selectedElement.id);
            this.selectedElement = null;
        },
        changeLayer(direction) {
            if (!this.selectedElement) return;
            if (!this.selectedElement.zIndex) this.selectedElement.zIndex = 1;
            
            if (direction === 'up') {
                this.selectedElement.zIndex += 1;
            } else if (direction === 'down' && this.selectedElement.zIndex > 1) {
                this.selectedElement.zIndex -= 1;
            }
        },
        enterPresentationMode() {
            this.presentationMode = true;
            this.selectedElement = null;
        },
        navigateSlide(direction) {
            const nextIndex = this.currentSlideIndex + direction;
            if (nextIndex >= 0 && nextIndex < this.slides.length) {
                this.currentSlideIndex = nextIndex;
            }
        },
        handleGlobalKeydowns(event) {
            if (event.key === 'Escape' && this.presentationMode) {
                this.presentationMode = false;
            }
            if (this.presentationMode) {
                if (event.key === 'ArrowRight' || event.key === ' ') {
                    this.navigateSlide(1);
                }
                if (event.key === 'ArrowLeft') {
                    this.navigateSlide(-1);
                }
            }
        },
        startDrag(event, element) {
            // Changed validation tag selector checks to let textareas edit cleanly without losing focus
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

            this.selectedElement = element;
            this.isDragging = true;
            this.dragTarget = element;
            
            this.dragOffset.x = event.clientX - element.left;
            this.dragOffset.y = event.clientY - element.top;

            window.addEventListener('mousemove', this.onDrag);
            window.addEventListener('mouseup', this.stopDrag);
        },
        onDrag(event) {
            if (!this.isDragging || !this.dragTarget) return;
            this.dragTarget.left = event.clientX - this.dragOffset.x;
            this.dragTarget.top = event.clientY - this.dragOffset.y;
        },
        stopDrag() {
            this.isDragging = false;
            this.dragTarget = null;
            window.removeEventListener('mousemove', this.onDrag);
            window.removeEventListener('mouseup', this.stopDrag);
        },
        handleExport() {
            window.AveroExporter.exportToJsFile(this.slides);
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
                    const parsedData = window.AveroExporter.importFromJsText(evt.target.result);
                    if (parsedData && Array.isArray(parsedData)) {
                        this.slides = parsedData;
                        this.currentSlideIndex = 0;
                        this.selectedElement = null;
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    }
}).mount('#app');

window.AveroExporter = {
    exportToJsFile: function(presentationData) {
        const dataString = JSON.stringify(presentationData, null, 2);
        const fileContent = `const AVERO_PRESENTATION = ${dataString};`;
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `avero-deck-${Date.now()}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    importFromJsText: function(fileText) {
        try {
            const jsonString = fileText.replace(/const\s+AVERO_PRESENTATION\s*=\s*/, '').replace(/;$/, '').trim();
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Export parser runtime failure: ", e);
            alert("Malformed configuration file standard parsed.");
            return null;
        }
    }
};
