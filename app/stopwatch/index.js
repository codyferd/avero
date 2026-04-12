const { createApp, ref, computed, onBeforeUnmount } = Vue;

createApp({
    setup() {
        const time = ref(0); // in milliseconds
        const isRunning = ref(false);
        const laps = ref([]);
        let timerInterval = null;
        let startTime = 0;

        const formattedTime = computed(() => {
            const totalMs = time.value;
            const mins = Math.floor(totalMs / 60000);
            const secs = Math.floor((totalMs % 60000) / 1000);
            const ms = Math.floor((totalMs % 1000) / 10);

            return {
                main: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
                                       ms: ms.toString().padStart(2, '0')
            };
        });

        const toggle = () => {
            if (isRunning.value) {
                clearInterval(timerInterval);
            } else {
                startTime = Date.now() - time.value;
                timerInterval = setInterval(() => {
                    time.value = Date.now() - startTime;
                }, 10);
            }
            isRunning.value = !isRunning.value;
        };

        const lap = () => {
            const f = formattedTime.value;
            laps.value.push(`${f.main}.${f.ms}`);
        };

        const reset = () => {
            clearInterval(timerInterval);
            isRunning.value = false;
            time.value = 0;
            laps.value = [];
        };

        onBeforeUnmount(() => clearInterval(timerInterval));

        return { time, isRunning, laps, formattedTime, toggle, lap, reset };
    }
}).mount('#app');
