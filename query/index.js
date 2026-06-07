const { createApp, ref, computed, reactive } = Vue;

createApp({
    setup() {
        // Absolute clean slate zeroed default array
        const sources = ref([]);
        
        const globalQuery = ref('');
        const activeFilter = ref('ALL');
        const showHelp = ref(false);
        
        const fileStatus = reactive({
            message: null,
            isError: false
        });

        // Compute filters out of completely uploaded properties
        const uniqueTypes = computed(() => {
            const types = sources.value.map(s => s.type || 'GENERIC');
            return [...new Set(types)];
        });

        const filteredSources = computed(() => {
            if (activeFilter.value === 'ALL') {
                return sources.value;
            }
            return sources.value.filter(s => (s.type || 'GENERIC') === activeFilter.value);
        });

        // Live Javascript text variable payload evaluation processing pipeline
        const handleFileImport = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const textRaw = e.target.result;
                try {
                    // Injecting a safe execution wrapper to capture customSources block cleanly
                    // inside an isolated function frame instead of throwing it global.
                    const dynamicSandbox = new Function(`
                        ${textRaw}; 
                        if (typeof customSources !== 'undefined') { 
                            return customSources; 
                        } else { 
                            throw new Error('Target variable "customSources" was not declared in script body.'); 
                        }
                    `);
                    
                    const parsedArray = dynamicSandbox();

                    if (!Array.isArray(parsedArray)) {
                        throw new Error('Target entity "customSources" must exist as a structural Array matrix.');
                    }

                    // Map parsed array, validating fields and setting standard values for missing entries
                    sources.value = parsedArray.map(node => ({
                        name: String(node.name || 'Unnamed Router Node'),
                        description: String(node.description || 'No system descriptor field supplied.'),
                        url: String(node.url || ''),
                        type: node.type ? String(node.type).toUpperCase() : 'GENERIC'
                    }));

                    fileStatus.message = `Successfully integrated ${sources.value.length} router channels.`;
                    fileStatus.isError = false;
                    activeFilter.value = 'ALL';
                } catch (err) {
                    fileStatus.message = `Compilation Error: ${err.message}`;
                    fileStatus.isError = true;
                    sources.value = []; // Reset interface safety locks
                }
            };

            reader.onerror = () => {
                fileStatus.message = "Critical file terminal read anomaly encountered.";
                fileStatus.isError = true;
            };

            reader.readAsText(file);
        };

        const getRoutedUrl = (templateUrl, queryText) => {
            const cleanQuery = encodeURIComponent(queryText.trim());
            if (templateUrl.includes('%s')) {
                return templateUrl.replace('%s', cleanQuery);
            }
            return `${templateUrl}${cleanQuery}`;
        };

        const launchSingleEngine = (engine) => {
            if (!globalQuery.value.trim() || !engine.url) return;
            window.open(getRoutedUrl(engine.url, globalQuery.value), '_blank');
        };

        const fireAllFilteredEngines = () => {
            if (!globalQuery.value.trim()) return;
            filteredSources.value.forEach(engine => {
                if (engine.url) {
                    window.open(getRoutedUrl(engine.url, globalQuery.value), '_blank');
                }
            });
        };

        const testStaticEngine = (rootUrl) => {
            if (!rootUrl) return;
            const rootDomain = rootUrl.split('?')[0];
            window.open(rootDomain, '_blank');
        };

        return {
            sources,
            globalQuery,
            activeFilter,
            showHelp,
            fileStatus,
            uniqueTypes,
            filteredSources,
            handleFileImport,
            launchSingleEngine,
            fireAllFilteredEngines,
            testStaticEngine
        };
    }
}).mount('#app');
