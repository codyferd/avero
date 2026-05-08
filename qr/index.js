const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const text = ref('');
        const size = ref(256);
        const level = ref('H'); // High correction allows for better scanning
        const qrContainer = ref(null);
        let qrcode = null;

        const generateQR = () => {
            if (!text.value) return;

            // Clear previous QR
            qrContainer.value.innerHTML = '';

            qrcode = new QRCode(qrContainer.value, {
                text: text.value,
                width: parseInt(size.value),
                                height: parseInt(size.value),
                                colorDark: "#000000",
                                colorLight: "#ffffff",
                                correctLevel: QRCode.CorrectLevel[level.value]
            });
        };

        // Re-generate whenever values change
        watch([text, size, level], () => {
            if (text.value) {
                generateQR();
            }
        });

        const downloadQR = () => {
            const img = qrContainer.value.querySelector('img');
            if (!img) return;

            const link = document.createElement('a');
            link.download = `avero-qr-${Date.now()}.png`;
            link.href = img.src;
            link.click();
        };

        return {
            text, size, level, qrContainer, downloadQR
        };
    }
}).mount('#app');
