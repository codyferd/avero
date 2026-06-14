const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        // App Controller Layer States
        const operationMode = ref('encrypt'); // Supported toggles: 'encrypt' | 'decrypt'
        const payloadType = ref('text');     // Supported toggles: 'text' | 'file'
        const passphrase = ref('');
        const showPassword = ref(false);
        const isProcessing = ref(false);
        const statusMessage = ref('');

        // Workspace Pipeline Buffers
        const textInput = ref('');
        const fileInput = ref(null);
        const textOutput = ref('');
        const isDragging = ref(false);

        // Crypto Standard Parameter Settings Configuration
        const CRYPTO_SALT = new Uint8Array([86, 12, 99, 23, 104, 56, 11, 89, 43, 21, 90, 77, 34, 112, 9, 65]); // Immutable Salt Block
        const PBKDF2_ITERATIONS = 100000; // Strong balancing iteration value

        const hasInputContent = computed(() => {
            return payloadType.value === 'text' ? textInput.value.length > 0 : fileInput.value !== null;
        });

        const setOperationMode = (mode) => {
            operationMode.value = mode;
            textOutput.value = '';
            statusMessage.value = '';
        };

        const setPayloadType = (type) => {
            payloadType.value = type;
            clearInputSource();
        };

        const togglePasswordVisibility = () => {
            showPassword.value = !showPassword.value;
        };

        const clearInputSource = () => {
            textInput.value = '';
            fileInput.value = null;
            textOutput.value = '';
            statusMessage.value = '';
            const picker = document.getElementById('native-file-picker-node');
            if (picker) picker.value = '';
        };

        const resetWorkspace = () => {
            passphrase.value = '';
            clearInputSource();
        };

        // --- Drag Drop Mobile Form File Handling Routines ---
        const onDragOver = () => { isDragging.value = true; };
        const onDragLeave = () => { isDragging.value = false; };
        const onFileDrop = (e) => {
            isDragging.value = false;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.value = e.dataTransfer.files[0];
                textOutput.value = '';
            }
        };
        const triggerFileSelect = () => {
            document.getElementById('native-file-picker-node')?.click();
        };
        const onFileSelected = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                fileInput.value = e.target.files[0];
                textOutput.value = '';
            }
        };

        // --- Low Level Web Crypto System API Core Logic Block ---
        const deriveCryptographicKey = async (rawPassword) => {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(rawPassword);

            // Import password as a raw base key material node
            const baseKey = await window.crypto.subtle.importKey(
                "raw",
                passwordBuffer,
                { name: "PBKDF2" },
                false,
                ["deriveBits", "deriveKey"]
            );

            // Derive an immutable key mapped into secure AES-GCM 256 execution parameters
            return await window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: CRYPTO_SALT,
                    iterations: PBKDF2_ITERATIONS,
                    hash: "SHA-256"
                },
                baseKey,
                { name: "AES-GCM", length: 256 },
                false,
                ["encrypt", "decrypt"]
            );
        };

        const processCryptographicPayload = async () => {
            if (!passphrase.value) return;
            isProcessing.value = true;
            textOutput.value = '';
            statusMessage.value = 'Initializing processing nodes...';

            try {
                const cryptoKey = await deriveCryptographicKey(passphrase.value);

                if (payloadType.value === 'text') {
                    if (operationMode.value === 'encrypt') {
                        await runTextEncryption(cryptoKey);
                    } else {
                        await runTextDecryption(cryptoKey);
                    }
                } else {
                    if (operationMode.value === 'encrypt') {
                        await runFileEncryption(cryptoKey);
                    } else {
                        await runFileDecryption(cryptoKey);
                    }
                }
            } catch (err) {
                console.error(err);
                statusMessage.value = '⚠️ Fatal Error: Verification signature matching failed.';
            } finally {
                isProcessing.value = false;
            }
        };

        // --- Symmetric Array Plain Text Pipelines ---
        const runTextEncryption = async (cryptoKey) => {
            if (!textInput.value) { statusMessage.value = 'No payload provided.'; return; }
            
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(textInput.value);
            const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Crypto-grade Initialization Vector

            const cipherBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                cryptoKey,
                dataBuffer
            );

            // Packaging: Combine IV and Ciphertext together into a single Uint8Array array block
            const combinedResult = new Uint8Array(iv.length + cipherBuffer.byteLength);
            combinedResult.set(iv, 0);
            combinedResult.set(new Uint8Array(cipherBuffer), iv.length);

            // Convert raw buffer into a single string line via clean Base64 encoding schemas
            textOutput.value = btoa(String.fromCharCode(...combinedResult));
            statusMessage.value = '✓ Text payload successfully encrypted.';
        };

        const runTextDecryption = async (cryptoKey) => {
            if (!textInput.value) { statusMessage.value = 'No data to read.'; return; }

            try {
                // Read package from inbound Base64 input string array
                const binaryString = atob(textInput.value.trim());
                const combinedBuffer = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    combinedBuffer[i] = binaryString.charCodeAt(i);
                }

                // Slice package out cleanly to separate the unique IV marker from raw cipher text array
                const iv = combinedBuffer.slice(0, 12);
                const ciphertext = combinedBuffer.slice(12);

                const plainBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    cryptoKey,
                    ciphertext
                );

                const decoder = new TextDecoder();
                textOutput.value = decoder.decode(plainBuffer);
                statusMessage.value = '✓ Text payload decipher decrypted.';
            } catch (e) {
                statusMessage.value = '⚠️ Error: Invalid secret phrase code or corrupt cypher string blocks.';
            }
        };

        // --- Highly Optimized Native Streaming File Object Pipelines ---
        const runFileEncryption = async (cryptoKey) => {
            if (!fileInput.value) { statusMessage.value = 'No local file object loaded.'; return; }

            statusMessage.value = 'Reading local storage byte buffers...';
            const rawFileBuffer = await fileInput.value.arrayBuffer();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            statusMessage.value = 'Running system cipher algorithms...';
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                cryptoKey,
                rawFileBuffer
            );

            const packedOutput = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            packedOutput.set(iv, 0);
            packedOutput.set(new Uint8Array(encryptedBuffer), iv.length);

            statusMessage.value = 'Packaging target data blob...';
            triggerNativeDownloadLink(packedOutput, `${fileInput.value.name}.avero`, 'application/octet-stream');
            statusMessage.value = '✓ Encrypted file package pushed out successfully.';
        };

        const runFileDecryption = async (cryptoKey) => {
            if (!fileInput.value) { statusMessage.value = 'No matching crypt payload found.'; return; }

            statusMessage.value = 'Reading binary array sequences...';
            const combinedFileBuffer = new Uint8Array(await fileInput.value.arrayBuffer());

            if (combinedFileBuffer.length < 12) {
                statusMessage.value = '⚠️ Error: Binary signature corrupted or malformed file element data.';
                return;
            }

            const iv = combinedFileBuffer.slice(0, 12);
            const encryptedBytes = combinedFileBuffer.slice(12);

            try {
                statusMessage.value = 'Validating validation signatures...';
                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    cryptoKey,
                    encryptedBytes
                );

                // Strip .avero extensions gracefully from output name values if explicitly matching
                let cleanOutputName = fileInput.value.name.replace(/\.avero$/i, '');
                if (cleanOutputName === fileInput.value.name) {
                    cleanOutputName = 'decrypted_' + cleanOutputName;
                }

                statusMessage.value = 'Assembling restored file element...';
                triggerNativeDownloadLink(new Uint8Array(decryptedBuffer), cleanOutputName, 'application/octet-stream');
                statusMessage.value = '✓ Data block successfully deciphered.';
            } catch (e) {
                statusMessage.value = '⚠️ Decryption Failed: Invalid key passphrase supplied.';
            }
        };

        // --- Core Shared Support Utilities Tools ---
        const triggerNativeDownloadLink = (uint8ArrayData, fileName, mimeType) => {
            const downloadBlob = new Blob([uint8ArrayData], { type: mimeType });
            const dynamicAnchor = document.createElement('a');
            dynamicAnchor.href = URL.createObjectURL(downloadBlob);
            dynamicAnchor.download = fileName;
            document.body.appendChild(dynamicAnchor);
            dynamicAnchor.click();
            document.body.removeChild(dynamicAnchor);
            URL.revokeObjectURL(dynamicAnchor.href);
        };

        const copyOutputToClipboard = () => {
            if (!textOutput.value) return;
            navigator.clipboard.writeText(textOutput.value);
            const primaryMessage = statusMessage.value;
            statusMessage.value = '📋 Copied to Clipboard!';
            setTimeout(() => { statusMessage.value = primaryMessage; }, 2000);
        };

        const formatBytes = (bytes, decimals = 2) => {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        };

        return {
            operationMode, payloadType, passphrase, showPassword, isProcessing, statusMessage,
            textInput, fileInput, textOutput, isDragging, hasInputContent,
            setOperationMode, setPayloadType, togglePasswordVisibility, clearInputSource, resetWorkspace,
            onDragOver, onDragLeave, onFileDrop, triggerFileSelect, onFileSelected,
            processCryptographicPayload, copyOutputToClipboard, formatBytes
        };
    }
}).mount('#app');
