        const { createApp, ref, onMounted } = Vue;
        createApp({
            setup() {
                const input = ref(""), formula = ref(""), history = ref([]), activeTab = ref("math"), term = ref(null);

                const constants = {
                    "phi": "1.618",
                    "c": "2.997e8",
                    "G": "6.674e-11",
                    "h": "6.626e-34"
                };

                const add = (v) => {
                    input.value += v;
                    term.value.focus();
                };

                const exec = () => {
                    if(!input.value) return;
                    try {
                        const res = math.evaluate(input.value);
                        const out = math.format(res, { precision: 12 }).toString();
                        formula.value = input.value;
                        history.value.unshift({ exp: input.value, res: out });
                        input.value = out;
                    } catch(e) {
                        input.value = "SYNTAX_ERROR";
                        setTimeout(() => input.value = "", 1000);
                    }
                };

                onMounted(() => term.value.focus());
                return { input, formula, history, activeTab, term, add, exec, constants };
            }
        }).mount('#app');
