const { createApp, ref, computed, onUnmounted } = Vue;

createApp({
    setup() {
        const mediaItems = ref([]);
        const activeFilter = ref("ALL");
        const activeLightboxItem = ref(null);

        const handleDirectoryScan = (e) => {
            const files = Array.from(e.target.files);

            // Clean out old system tracking object allocations to free memory heap loops
            clearCurrentMediaBatch();

            const parsedBatch = [];

            files.forEach(file => {
                const path = file.webkitRelativePath || file.name;
                const extension = file.name.split('.').pop().toLowerCase();
                let category = null;

                // Sort out media pipelines based on native browser MIME definitions
                if (file.type.startsWith('image/')) {
                    category = "IMAGE";
                } else if (file.type.startsWith('video/')) {
                    category = "VIDEO";
                }

                if (category) {
                    parsedBatch.push({
                        name: file.name,
                        path: path,
                        extension: extension,
                        category: category,
                        // Create virtual runtime pointers mapped to the raw filesystem buffer blocks
                        url: URL.createObjectURL(file)
                    });
                }
            });

            // Alphabetic sorting arrangement based on asset naming sequences
            mediaItems.value = parsedBatch.sort((a, b) => a.name.localeCompare(b.name));
        };

        // Filter Grid Array computation tracking context
        const filteredItems = computed(() => {
            if (activeFilter.value === 'ALL') return mediaItems.value;
            return mediaItems.value.filter(item => item.category === activeFilter.value);
        });

        const openLightbox = (item) => {
            activeLightboxItem.value = item;
            document.body.style.overflow = 'hidden'; // Freeze scrolling context
        };

        const closeLightbox = () => {
            activeLightboxItem.value = null;
            document.body.style.overflow = ''; // Unlock viewport scrolling
        };

        const clearCurrentMediaBatch = () => {
            mediaItems.value.forEach(item => {
                URL.revokeObjectURL(item.url);
            });
            mediaItems.value = [];
        };

        // Revoke memory on application framework destruction
        onUnmounted(() => {
            clearCurrentMediaBatch();
        });

        return {
            mediaItems, activeFilter, activeLightboxItem, filteredItems,
            handleDirectoryScan, openLightbox, closeLightbox
        };
    }
}).mount('#app');
