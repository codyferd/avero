const { createApp, ref, watch } = Vue;

createApp({
    setup() {
        const inputText = ref('');
        const translatedText = ref('');
        const targetLang = ref('es');
        const loading = ref(false);
        let timer = null;

        const translateText = async () => {
            if (!inputText.value.trim()) {
                translatedText.value = '';
                return;
            }

            loading.value = true;
            try {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText.value)}&langpair=en|${targetLang.value}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.responseData) {
                    translatedText.value = data.responseData.translatedText;
                }
            } catch (error) {
                translatedText.value = "Connection failed.";
            } finally {
                loading.value = false;
            }
        };

        const debouncedTranslate = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                translateText();
            }, 800);
        };

        watch(targetLang, () => {
            translateText();
        });

        const clear = () => {
            inputText.value = '';
            translatedText.value = '';
        };

        return {
            inputText,
            translatedText,
            targetLang,
            languages, // Added this to the return
            loading,
            debouncedTranslate,
            clear
        };
    }
}).mount('#app');

