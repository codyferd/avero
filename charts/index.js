const { createApp } = Vue;

createApp({
    data() {
        return {
            vueMode: false,
            chartSettings: {
                title: 'Avero Enterprise Cross-Metric Timeline Vectors',
                type: 'time', // Available types: 'pie', 'bar', 'line', 'polar', 'time'
                timeLabels: ['Q1', 'Q2', 'Q3', 'Q4'] // Chronological x-axis coordinate tags
            },
            chartTypes: [
                { value: 'time', label: 'Time Graph Series', icon: '⏳' },
                { value: 'pie', label: 'Pie Chart Vector', icon: '🍕' },
                { value: 'bar', label: 'Bar Matrix Grid', icon: '📊' },
                { value: 'line', label: 'Line Flow Graph', icon: '📈' },
                { value: 'polar', label: 'Polar Grid Scope', icon: '🎯' }
            ],
            // Multidimensional data model nodes supporting historical tracking sequences
            chartDataNodes: [
                { id: 101, label: 'Cloud Compute Nodes', value: 420, history: [110, 240, 310, 420], color: '#10b981' },
                { id: 102, label: 'Security Firewall Audits', value: 280, history: [390, 320, 290, 280], color: '#38bdf8' },
                { id: 103, label: 'Data Processing Pipelines', value: 190, history: [150, 220, 180, 190], color: '#f59e0b' }
            ]
        };
    },
    computed: {
        getDataNodesTotalAggregate() {
            return this.chartDataNodes.reduce((acc, curr) => acc + (curr.value || 0), 0);
        }
    },
    mounted() {
        this.renderCanvasChartVisualization();
    },
    watch: {
        vueMode() {
            this.queueRenderUpdate();
        }
    },
    methods: {
        addNewDataNodePoint() {
            const colors = ['#a855f7', '#f43f5e', '#14b8a6', '#ec4899', '#65a30d'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            this.chartDataNodes.push({
                id: Date.now(),
                label: 'Global Metric Cluster',
                value: Math.floor(Math.random() * 200) + 100,
                history: [
                    Math.floor(Math.random() * 300) + 50,
                    Math.floor(Math.random() * 300) + 50,
                    Math.floor(Math.random() * 300) + 50,
                    Math.floor(Math.random() * 300) + 50
                ],
                color: randomColor
            });
            this.queueRenderUpdate();
        },
        deleteDataNodePoint(id) {
            this.chartDataNodes = this.chartDataNodes.filter(node => node.id !== id);
            this.queueRenderUpdate();
        },
        selectChartType(type) {
            this.chartSettings.type = type;
            this.queueRenderUpdate();
        },
        queueRenderUpdate() {
            this.$nextTick(() => {
                this.renderCanvasChartVisualization();
            });
        },

        /**
         * Graphics Canvas Renderer Engine
         * Built onto native HTML5 canvas pipeline primitives
         */
        renderCanvasChartVisualization() {
            const canvas = this.$refs.chartCanvas;
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(centerX, centerY) - 40;
            const padding = 60;
            
            if (this.chartDataNodes.length === 0) {
                ctx.fillStyle = '#4b5563';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('NO DATA INPUT NODES FOUND IN MATRIX ENGINE BUFFERS', centerX, centerY);
                return;
            }

            const totalSum = this.chartDataNodes.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;
            const totalElements = this.chartDataNodes.length;

            /**
             * NEW TYPE: Time Graph (Multi-line Timeline Vector Engine)
             */
            if (this.chartSettings.type === 'time') {
                const graphWidth = width - (padding * 2);
                const graphHeight = height - (padding * 2);
                const intervalCount = this.chartSettings.timeLabels.length;
                const stepX = graphWidth / (intervalCount - 1 || 1);
                
                // Find global absolute peak value across all active timeline history vectors safely
                let peakValue = 10;
                this.chartDataNodes.forEach(node => {
                    node.history.forEach(v => { if (v > peakValue) peakValue = v; });
                });
                // Pad scale target bounds
                peakValue = Math.ceil(peakValue * 1.1);

                // Grid Guide Tick Layers Pass
                ctx.strokeStyle = '#18181b';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const ratio = i / 4;
                    const yTick = height - padding - (ratio * graphHeight);
                    
                    ctx.beginPath();
                    ctx.moveTo(padding, yTick);
                    ctx.lineTo(width - padding, yTick);
                    ctx.stroke();
                    
                    // Render Grid Core Left Axis Numbers
                    ctx.fillStyle = '#52525b';
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'right';
                    ctx.fillText(Math.round(ratio * peakValue), padding - 10, yTick + 3);
                }

                // Draw Structural Boundary Lines Map
                ctx.strokeStyle = '#27272a';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding, height - padding);
                ctx.lineTo(width - padding, height - padding);
                ctx.stroke();

                // Plot Structural Time Keyframe Indicators Along Horizontal X-Axis
                this.chartSettings.timeLabels.forEach((label, index) => {
                    const xLabelPos = padding + (index * stepX);
                    ctx.fillStyle = '#71717a';
                    ctx.font = '10px font-mono';
                    ctx.textAlign = 'center';
                    ctx.fillText(label.toUpperCase(), xLabelPos, height - padding + 20);
                });

                // Iterate and draw distinct path vectors lines for every active entity item
                this.chartDataNodes.forEach(node => {
                    ctx.beginPath();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = node.color;
                    
                    node.history.forEach((val, idx) => {
                        const posX = padding + (idx * stepX);
                        const posY = height - padding - ((val / peakValue) * graphHeight);
                        
                        if (idx === 0) ctx.moveTo(posX, posY);
                        else ctx.lineTo(posX, posY);
                    });
                    ctx.stroke();

                    // Render interactive anchor vertex blocks dots
                    node.history.forEach((val, idx) => {
                        const posX = padding + (idx * stepX);
                        const posY = height - padding - ((val / peakValue) * graphHeight);
                        
                        ctx.beginPath();
                        ctx.arc(posX, posY, 4, 0, 2 * Math.PI);
                        ctx.fillStyle = node.color;
                        ctx.fill();
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    });
                });
            }
            /**
             * Core Fallback Type: Standard Single Variable Pie Layout Architecture
             */
            else if (this.chartSettings.type === 'pie') {
                let startAngle = 0;
                this.chartDataNodes.forEach(node => {
                    const sliceAngle = ((node.value || 0) / totalSum) * (2 * Math.PI);
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                    ctx.closePath();
                    ctx.fillStyle = node.color;
                    ctx.fill();
                    startAngle += sliceAngle;
                });
            } 
            /**
             * Core Fallback Type: Standard Vertical Bar Matrix Architecture
             */
            else if (this.chartSettings.type === 'bar') {
                const graphWidth = width - (padding * 2);
                const graphHeight = height - (padding * 2);
                const barGap = 16;
                const barWidth = (graphWidth / totalElements) - barGap;
                const maxValue = Math.max(...this.chartDataNodes.map(n => n.value || 0), 1);
                
                ctx.strokeStyle = '#27272a';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding, height - padding);
                ctx.lineTo(width - padding, height - padding);
                ctx.stroke();

                this.chartDataNodes.forEach((node, idx) => {
                    const computedHeight = ((node.value || 0) / maxValue) * graphHeight;
                    const x = padding + (idx * (barWidth + barGap)) + (barGap / 2);
                    const y = height - padding - computedHeight;
                    
                    ctx.fillStyle = node.color;
                    ctx.fillRect(x, y, barWidth, computedHeight);
                    
                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(node.value || 0, x + (barWidth / 2), y - 6);
                });
            } 
            /**
             * Core Fallback Type: Standard Single Variable Line Mapping Graph
             */
            else if (this.chartSettings.type === 'line') {
                const graphWidth = width - (padding * 2);
                const graphHeight = height - (padding * 2);
                const maxValue = Math.max(...this.chartDataNodes.map(n => n.value || 0), 1);
                const stepX = graphWidth / (totalElements > 1 ? totalElements - 1 : 1);
                
                ctx.strokeStyle = '#27272a';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding, height - padding);
                ctx.lineTo(width - padding, height - padding);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = this.chartDataNodes[0]?.color || '#10b981';
                
                const points = [];
                this.chartDataNodes.forEach((node, idx) => {
                    const x = padding + (idx * stepX);
                    const y = height - padding - (((node.value || 0) / maxValue) * graphHeight);
                    points.push({ x, y, color: node.color, val: node.value });
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
                
                points.forEach(pt => {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = pt.color;
                    ctx.fill();
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    
                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(pt.val || 0, pt.x, pt.y - 10);
                });
            } 
            /**
             * Core Fallback Type: Standard Polar Concentric Radar Radar Topology
             */
            else if (this.chartSettings.type === 'polar') {
                let currentSliceAngle = 0;
                const angleSegment = (2 * Math.PI) / totalElements;
                const maxVal = Math.max(...this.chartDataNodes.map(n => n.value || 0), 1);

                ctx.strokeStyle = '#18181b';
                ctx.lineWidth = 1;
                [0.3, 0.6, 1].forEach(scale => {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius * scale, 0, 2 * Math.PI);
                    ctx.stroke();
                });

                this.chartDataNodes.forEach(node => {
                    const adaptiveRadius = ((node.value || 0) / maxVal) * radius;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, adaptiveRadius, currentSliceAngle, currentSliceAngle + angleSegment);
                    ctx.closePath();
                    ctx.fillStyle = node.color + 'cc';
                    ctx.fill();
                    ctx.strokeStyle = node.color;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    currentSliceAngle += angleSegment;
                });
            }
        },

        /**
         * Image Frame Buffer Serialization Pipeline Exporter
         */
        saveChartAsImage() {
            const canvas = this.$refs.chartCanvas;
            if (!canvas) return;
            
            const exportVirtualCanvas = document.createElement('canvas');
            exportVirtualCanvas.width = canvas.width + 40;
            exportVirtualCanvas.height = canvas.height + 80;
            const virtualCtx = exportVirtualCanvas.getContext('2d');
            
            virtualCtx.fillStyle = '#09090b';
            virtualCtx.fillRect(0, 0, exportVirtualCanvas.width, exportVirtualCanvas.height);
            
            virtualCtx.fillStyle = '#ffffff';
            virtualCtx.font = 'bold 15px sans-serif';
            virtualCtx.textAlign = 'center';
            virtualCtx.fillText(this.chartSettings.title || 'Untitled Dataset Report', exportVirtualCanvas.width / 2, 30);
            
            virtualCtx.drawImage(canvas, 20, 50);
            
            const urlImageString = exportVirtualCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = urlImageString;
            link.download = `avero-chart-export-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        handleExport() {
            const packoutPayload = {
                settings: this.chartSettings,
                nodes: this.chartDataNodes
            };
            window.AveroChartExporter.exportToJsFile(packoutPayload);
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
                    const parsedData = window.AveroChartExporter.importFromJsText(evt.target.result);
                    if (parsedData && parsedData.settings && Array.isArray(parsedData.nodes)) {
                        this.chartSettings = parsedData.settings;
                        this.chartDataNodes = parsedData.nodes;
                        this.vueMode = false;
                        this.queueRenderUpdate();
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    }
}).mount('#app');

/**
 * Isolated Global Chart Serialization Controller Module System Engine Object
 */
window.AveroChartExporter = {
    exportToJsFile: function(chartWorkspaceData) {
        const dataString = JSON.stringify(chartWorkspaceData, null, 2);
        const fileContent = `const AVERO_CHART = ${dataString};`;
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `avero-chart-${Date.now()}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    importFromJsText: function(fileText) {
        try {
            const startAssignmentIdx = fileText.indexOf('const AVERO_CHART =');
            if (startAssignmentIdx === -1) {
                throw new Error("Invalid Format Structure: Target tokens code assignments context missing records.");
            }

            let extractionZone = fileText.substring(startAssignmentIdx);
            let jsonString = extractionZone.replace(/const\s+AVERO_CHART\s*=\s*/, '').trim();

            if (jsonString.endsWith(';')) {
                jsonString = jsonString.slice(0, -1).trim();
            }

            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Export parser system crash error logging telemetry: ", e);
            alert("Failed parsing chart data safely. MALFORMED_FILE.");
            return null;
        }
    }
};
