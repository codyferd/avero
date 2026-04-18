const { createApp, ref } = Vue;
createApp({
    setup() {
        const mediaUrl = ref(null);
        const fileName = ref("");
        const fileCategory = ref("");
        const rawType = ref("");

        const processFile = (file) => {
            if (!file) return;
            if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value);

            fileName.value = file.name;
            rawType.value = file.type;

            if (file.type.startsWith('image/')) fileCategory.value = "IMAGE";
            else if (file.type.startsWith('video/')) fileCategory.value = "VIDEO";
            else if (file.type.startsWith('audio/')) fileCategory.value = "AUDIO";
            else fileCategory.value = "UNKNOWN";

            mediaUrl.value = URL.createObjectURL(file);
        };

        const handleFile = (e) => processFile(e.target.files[0]);

        const handleDrop = (e) => {
            const file = e.dataTransfer.files[0];
            processFile(file);
        };

        const resetPlayer = () => {
            if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value);
            mediaUrl.value = null;
            fileName.value = "";
            fileCategory.value = "";
            rawType.value = "";
        };

        return { mediaUrl, fileName, fileCategory, rawType, handleFile, handleDrop, resetPlayer };
    }
}).mount('#app');
