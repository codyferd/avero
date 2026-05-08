const { createApp, ref, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        const mode = ref("scientific"); // 'scientific' or 'graphing'
        const input = ref("");
        const formula = ref("");
        const history = ref([]);
        const activeTab = ref("math");
        const term = ref(null);
        const graphCanvas = ref(null);
        const zoom = ref(20); // Pixels per unit

        const constants = {
            "phi": "1.618", "c": "2.997e8", "G": "6.674e-11", "h": "6.626e-34",
          "k": "1.38e-23", "avogadro": "6.022e23"
        };

        const graphEquations = ref([
            { text: "sin(x)", color: "#6366f1" },
                                   { text: "x^2", color: "#10b981" }
        ]);

        const add = (v) => {
            input.value += v;
            if (term.value) term.value.focus();
        };

            const exec = () => {
                if (!input.value) return;
                try {
                    const res = math.evaluate(input.value);
                    const out = math.format(res, { precision: 12 }).toString();
                    formula.value = input.value;
                    history.value.unshift({ exp: input.value, res: out });
                    input.value = out;
                } catch (e) {
                    input.value = "SYNTAX_ERROR";
                    setTimeout(() => input.value = "", 1000);
                }
            };

            // Graphing Engine
            const drawGraph = () => {
                const canvas = graphCanvas.value;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                const w = canvas.width = canvas.offsetWidth;
                const h = canvas.height = canvas.offsetHeight;

                ctx.clearRect(0, 0, w, h);

                // Draw Axes
                ctx.strokeStyle = "#1e293b";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); // X
                ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); // Y
                ctx.stroke();

                // Draw Grid
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                for(let i = 0; i < w; i += zoom.value) {
                    ctx.moveTo(i, 0); ctx.lineTo(i, h);
                    ctx.moveTo(0, i); ctx.lineTo(w, i);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Plot Functions
                graphEquations.value.forEach(eq => {
                    if (!eq.text) return;
                    try {
                        const expr = math.compile(eq.text);
                        ctx.strokeStyle = eq.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();

                        for (let px = 0; px < w; px++) {
                            const x = (px - w / 2) / zoom.value;
                            const y = expr.evaluate({ x: x });
                            const py = h / 2 - y * zoom.value;

                            if (px === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.stroke();
                    } catch (err) { /* Silent fail for partial expressions */ }
                });
            };

            const addEquation = () => {
                const colors = ["#6366f1", "#10b981", "#fbbf24", "#f43f5e", "#a855f7"];
                graphEquations.value.push({
                    text: "",
                    color: colors[graphEquations.value.length % colors.length]
                });
            };

            const removeEquation = (index) => graphEquations.value.splice(index, 1);
            const zoomIn = () => { zoom.value *= 1.5; drawGraph(); };
            const zoomOut = () => { zoom.value /= 1.5; drawGraph(); };

            // Handle Mode Changes
            watch(mode, (newMode) => {
                if (newMode === 'graphing') {
                    nextTick(drawGraph);
                }
            });

            onMounted(() => {
                if (term.value) term.value.focus();
                window.addEventListener('resize', drawGraph);
            });

            return {
                mode, input, formula, history, activeTab, term, add, exec, constants,
          graphCanvas, graphEquations, drawGraph, addEquation, removeEquation,
          zoom, zoomIn, zoomOut
            };
    }
}).mount('#app');

