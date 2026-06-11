/**
 * Avero Authenticator Core Engine
 * Standard RFC 6238 TOTP Cryptographic Implementation via OTPAuth Engine
 */
(() => {
    const { createApp, ref, onMounted, onUnmounted } = Vue;

    createApp({
        setup() {
            const authenticatorVault = ref([]);
            const newKeyForm = ref({ issuer: "", secret: "" });
            const isPresentationMode = ref(false);
            const globalCountdownTime = ref(30);
            const fileInputBridge = ref(null);
            let operationalTimeThread = null;

            /**
             * STANDARD TOTP GENERATION LOGIC (RFC 6238)
             * Utilizes the bundled OTPAuth context layer for authentic verification strings
             */
            const computeVerificationToken = (secretString) => {
                try {
                    if (!secretString) return "000000";
                    
                    // Normalize configuration keys strings 
                    const cleanSecret = secretString.replace(/[\s-]/g, "").toUpperCase();
                    if (cleanSecret.length === 0) return "000000";

                    // Initialize the real-time runtime token instance
                    const totpInstance = new OTPAuth.TOTP({
                        issuer: "Avero",
                        label: "Core Node",
                        algorithm: "SHA1",
                        digits: 6,
                        period: 30,
                        secret: OTPAuth.Secret.fromBase32(cleanSecret)
                    });

                    return totpInstance.generate();
                } catch (e) {
                    console.error("Cryptographic evaluation error:", e);
                    return "000000";
                }
            };

            const computeAllActiveTokens = () => {
                authenticatorVault.value.forEach(token => {
                    token.liveCode = computeVerificationToken(token.secret);
                });
            };

            /**
             * CHRONOS ENGINE: TIMING LOOP INTERCEPTOR
             */
            const initializeChronosLoop = () => {
                const synchronizeClockWindow = () => {
                    const currentSeconds = new Date().getSeconds();
                    globalCountdownTime.value = 30 - (currentSeconds % 30);
                    
                    if (globalCountdownTime.value === 30 || globalCountdownTime.value === 0) {
                        computeAllActiveTokens();
                    }
                };

                synchronizeClockWindow();
                computeAllActiveTokens();
                operationalTimeThread = setInterval(synchronizeClockWindow, 1000);
            };

            const togglePresentationMode = () => {
                isPresentationMode.value = !isPresentationMode.value;
            };

            const globalKeyIntercept = (event) => {
                if (event.key === "Escape" && isPresentationMode.value) {
                    isPresentationMode.value = false;
                }
            };

            onMounted(() => {
                initializeChronosLoop();
                window.addEventListener("keydown", globalKeyIntercept);
            });

            onUnmounted(() => {
                if (operationalTimeThread) clearInterval(operationalTimeThread);
                window.removeEventListener("keydown", globalKeyIntercept);
            });

            /**
             * DISK LOGISTICS EXPORT PORTAL
             */
            const exportToDiskAsset = () => {
                const backupPayload = {
                    application: "Avero Authenticator Secure Release",
                    timestamp: new Date().toISOString(),
                    vaultSchema: "v2.1.0",
                    vault: authenticatorVault.value.map(item => ({
                        issuer: item.issuer,
                        secret: item.secret
                    }))
                };

                const javascriptSerializationCode = `/**\n * Avero Authenticator Vault Payload Export\n * Encrypted Target Array Allocation Node\n */\nconst averoStudioProjectData = ${JSON.stringify(backupPayload, null, 4)};\n`;
                const storageBlob = new Blob([javascriptSerializationCode], { type: "application/javascript;charset=utf-8;" });
                
                const transitAnchor = document.createElement("a");
                transitAnchor.href = URL.createObjectURL(storageBlob);
                transitAnchor.download = `avero-auth-backup-${Math.floor(Date.now() / 1000)}.js`;
                
                document.body.appendChild(transitAnchor);
                transitAnchor.click();
                document.body.removeChild(transitAnchor);
            };

            /**
             * DISK LOGISTICS IMPORT PARSER PORTAL
             */
            const triggerImportBridge = () => {
                if (fileInputBridge.value) fileInputBridge.value.click();
            };

            const handleImportPayload = (event) => {
                const targetFile = event.target.files[0];
                if (!targetFile) return;

                const assetReader = new FileReader();
                assetReader.onload = (loadEvent) => {
                    let textContext = loadEvent.target.result.trim();

                    try {
                        if (textContext.includes("const averoStudioProjectData =")) {
                            textContext = textContext.split("const averoStudioProjectData =")[1].trim();
                        } else if (textContext.includes("=")) {
                            textContext = textContext.substring(textContext.indexOf("=") + 1).trim();
                        }

                        if (textContext.endsWith(";")) {
                            textContext = textContext.slice(0, -1).trim();
                        }

                        const parsedPayload = JSON.parse(textContext);

                        if (parsedPayload && Array.isArray(parsedPayload.vault)) {
                            authenticatorVault.value = parsedPayload.vault.map(item => ({
                                id: "token_" + Date.now() + Math.floor(Math.random() * 1000),
                                issuer: item.issuer || "",
                                secret: (item.secret || "").toUpperCase().replace(/[\s-]/g, ""),
                                liveCode: "000000"
                            }));
                            computeAllActiveTokens();
                            alert("Avero Security System: Authenticator matrix dataset initialized and updated safely.");
                        } else {
                            alert("Verification Collision: File is Javascript but lacks valid structural credentials model components.");
                        }
                    } catch (err) {
                        alert("Parsing Fault: Target stream contains layout corruptions or non-compilable blocks.");
                        console.error(err);
                    }
                    event.target.value = "";
                };
                assetReader.readAsText(targetFile);
            };

            const registerAuthenticatorToken = () => {
                if (!newKeyForm.value.secret) {
                    alert("Validation Error: Token base string key parameter is mandatory.");
                    return;
                }

                authenticatorVault.value.push({
                    id: "token_" + Date.now() + Math.floor(Math.random() * 10),
                    issuer: newKeyForm.value.issuer.trim() || "External Managed Node",
                    secret: newKeyForm.value.secret.trim().toUpperCase().replace(/[\s-]/g, ""),
                    liveCode: "000000"
                });

                newKeyForm.value.issuer = "";
                newKeyForm.value.secret = "";

                computeAllActiveTokens();
            };

            const purgeTokenVector = (index) => {
                if (confirm("System Warning: Destroy connection array mapping to this profile vector permanently?")) {
                    authenticatorVault.value.splice(index, 1);
                }
            };

            const formatTokenDigits = (codeString) => {
                if (!codeString || codeString.length !== 6) return codeString;
                return `${codeString.slice(0, 3)} ${codeString.slice(3)}`;
            };

            const copyTokenToClipboard = (codeString, event) => {
                navigator.clipboard.writeText(codeString).then(() => {
                    const originalNodeText = event.target.innerText;
                    event.target.innerText = "COPIED";
                    setTimeout(() => {
                        event.target.innerText = originalNodeText;
                    }, 800);
                });
            };

            return {
                authenticatorVault, newKeyForm, isPresentationMode, globalCountdownTime, fileInputBridge,
                togglePresentationMode, exportToDiskAsset, triggerImportBridge, handleImportPayload,
                registerAuthenticatorToken, purgeTokenVector, formatTokenDigits, copyTokenToClipboard
            };
        }
    }).mount('#app');
})();
