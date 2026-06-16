const { createApp, ref, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        const mode = ref("scientific"); // 'scientific' or 'graphing'
        const input = ref("");
        const formula = ref("");
        const history = ref([]);
        const activeTab = ref("basic");
        const term = ref(null);
        const graphCanvas = ref(null);
        const zoom = ref(40); // Base pixels per unit scale metric

        // Advanced live tracker properties for interactive hover calculations
        const mousePos = ref({ x: "0.00", y: "0.00", show: false });

        // Absolute constants configuration matrix native to core MathJS mapping systems
        const constants = {
            "pi": "3.14159265359",
            "e": "2.71828182846",
            "phi": "1.61803398875",
            "c": "299792458 m/s",
            "G": "6.6743e-11 m^3 / (kg s^2)",
            "h": "6.62607015e-34 J s",
            "k": "1.380649e-23 J/K",
            "avogadro": "6.02214076e23 mol^-1",
            "i": "Imaginary Radix Unit"
        };

        // Fully blank slate defaults setup logic as requested
        const graphEquations = ref([]);

        const add = (v) => {
            input.value += v;
            focusInput();
        };

        const addFunc = (f) => {
            input.value += f + "(";
            focusInput();
        };

        const focusInput = () => {
            if (term.value) {
                nextTick(() => {
                    term.value.focus();
                });
            }
        };

        const clearHistory = () => {
            history.value = [];
        };

        const exec = () => {
            if (!input.value) return;
            try {
                // Parse and evaluate code processing inside isolated global MathJS execution frame
                const res = math.evaluate(input.value);
                
                let outStr = "";
                if (res && typeof res.format === "function") {
                    outStr = res.format({ precision: 14 });
                } else {
                    outStr = math.format(res, { precision: 14 }).toString();
                }

                formula.value = input.value;
                history.value.unshift({ exp: input.value, res: outStr });
                input.value = outStr;
            } catch (e) {
                const errorContext = input.value;
                input.value = "COMPILATION_ERROR";
                formula.value = e.message;
                setTimeout(() => {
                    if (input.value === "COMPILATION_ERROR") {
                        input.value = errorContext;
                    }
                }, 1600);
            }
            focusInput();
        };

        // Interactive mouse placement analytics tracking on Graph Engine space matrix
        const trackMouse = (e) => {
            const canvas = graphCanvas.value;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            
            // Calculate coordinates localized against element context scale
            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;

            const dpr = window.devicePixelRatio || 1;
            const visualW = canvas.width / dpr;
            const visualH = canvas.height / dpr;

            const mathX = (clientX - visualW / 2) / zoom.value;
            const mathY = (visualH / 2 - clientY) / zoom.value;

            mousePos.value.x = mathX.toFixed(2);
            mousePos.value.y = mathY.toFixed(2);
            mousePos.value.show = true;
        };

        // Complete Advanced Multi-Function Graphing System Architecture
        const drawGraph = () => {
            const canvas = graphCanvas.value;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");

            // Setup high resolution backing transforms matching crisp displays automatically
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const currentZoom = zoom.value;

            // Draw Coordinate Subgrid lines
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // Vertical structural columns mapping
            for (let x = centerX % currentZoom; x < width; x += currentZoom) {
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
            }
            // Horizontal rows structural mapping
            for (let y = centerY % currentZoom; y < height; y += currentZoom) {
                ctx.moveTo(0, y); ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Render Core Cartesian Absolute Reference Axis Crosshairs
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X Axis
            ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y Axis
            ctx.stroke();

            // Plot values from input stack parsed out with safety compilation wrappers
            graphEquations.value.forEach(eq => {
                if (!eq.text.trim()) return;
                try {
                    // Compile incoming mathematical formula expressions using MathJS node structures
                    const expr = math.compile(eq.text);
                    
                    ctx.strokeStyle = eq.color;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();

                    let structuralStart = true;

                    for (let px = 0; px < width; px++) {
                        const xVal = (px - centerX) / currentZoom;
                        
                        // Parse safely through numeric calculation context layer
                        const yVal = expr.evaluate({ x: xVal });
                        
                        // Filter validation structures protecting limits from imaginary results or infinite ranges
                        if (typeof yVal === "number" && !isNaN(yVal) && isFinite(yVal)) {
                            const py = centerY - (yVal * currentZoom);
                            
                            if (py >= -100 && py <= height + 100) { 
                                if (structuralStart) {
                                    ctx.moveTo(px, py);
                                    structuralStart = false;
                                } else {
                                    ctx.lineTo(px, py);
                                }
                            } else {
                                structuralStart = true; // Break paths for vertical asymptote handling
                            }
                        } else {
                            structuralStart = true;
                        }
                    }
                    ctx.stroke();
                } catch (err) {
                    // Fail silently for ongoing user formula string manipulations
                }
            });
        };

        const addEquation = () => {
            const colors = ["#6366f1", "#10b981", "#fbbf24", "#f43f5e", "#a855f7", "#06b6d4"];
            graphEquations.value.push({
                text: "",
                color: colors[graphEquations.value.length % colors.length]
            });
        };

        const removeEquation = (index) => {
            graphEquations.value.splice(index, 1);
            drawGraph();
        };

        const zoomIn = () => { zoom.value = Math.min(500, zoom.value * 1.3); drawGraph(); };
        const zoomOut = () => { zoom.value = Math.max(5, zoom.value / 1.3); drawGraph(); };
        const resetView = () => { zoom.value = 40; drawGraph(); };

        // Bind lifecycle listeners tracking active display transformations
        watch(mode, (newMode) => {
            if (newMode === 'graphing') {
                nextTick(drawGraph);
            } else {
                focusInput();
            }
        });

        onMounted(() => {
            focusInput();
            window.addEventListener('resize', () => {
                if (mode.value === 'graphing') drawGraph();
            });
        });

        return {
            mode, input, formula, history, activeTab, term, add, addFunc, exec, constants,
            graphCanvas, graphEquations, drawGraph, addEquation, removeEquation,
            zoom, zoomIn, zoomOut, resetView, trackMouse, mousePos, clearHistory
        };
    }
}).mount('#app');
