const { createApp, ref, watch } = Vue;

createApp({
    setup() {
        const inputText = ref('');
        const translatedText = ref('');
        const sourceLang = ref('en'); // Added source memory state configuration
        const targetLang = ref('es');
        const loading = ref(false);
        let timer = null;

        const translateText = async () => {
            // Guard clause if data is empty or matching target languages are selected
            if (!inputText.value.trim()) {
                translatedText.value = '';
                return;
            }

            if (sourceLang.value === targetLang.value) {
                translatedText.value = inputText.value;
                return;
            }

            loading.value = true;
            try {
                // Dynamically build the two-way language pair protocol query string
                const query = encodeURIComponent(inputText.value);
                const pair = `${sourceLang.value}|${targetLang.value}`;
                const url = `https://api.mymemory.translated.net/get?q=${query}&langpair=${pair}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.responseData) {
                    translatedText.value = data.responseData.translatedText;
                } else if (data.responseStatus !== 200) {
                    translatedText.value = "Quota limited or translation failed.";
                }
            } catch (error) {
                translatedText.value = "Network relay disconnect.";
            } finally {
                loading.value = false;
            }
        };

        const debouncedTranslate = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                translateText();
            }, 600); // Slightly faster response delay window
        };

        // Instantly recalculate pipeline if languages are swapped or changed
        watch([sourceLang, targetLang], () => {
            if (inputText.value.trim()) {
                translateText();
            }
        });

        const swapLanguages = () => {
            const temp = sourceLang.value;
            sourceLang.value = targetLang.value;
            targetLang.value = temp;

            // If an output exists, make it the new source text input value
            if (translatedText.value && !loading.value) {
                inputText.value = translatedText.value;
            }
            translateText();
        };

        const clear = () => {
            inputText.value = '';
            translatedText.value = '';
        };

        return {
            inputText,
            translatedText,
            sourceLang,
            targetLang,
            languages,
            loading,
            debouncedTranslate,
            translateText,
            swapLanguages,
            clear
        };
    }
}).mount('#app');
