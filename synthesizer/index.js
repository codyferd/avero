const { createApp, ref, computed, watch, onMounted, onUnmounted, nextTick } = Vue;

createApp({
    setup() {
        const sequenceString = ref("5.8v3.12~0.11.7._.8d2.10v9.8._.7.0~12.5.7.5.8.5.7.8.4.5");
        const tempo = ref(140);
        const gate = ref(0.7);
        const waveType = ref("triangle");
        
        // Master gain multiplier tracking reference (Baseline value = 1.0, maximum ceiling = 5.0)
        const masterVolume = ref(1.0);
        
        const isPlaying = ref(false);
        const currentNoteIndex = ref(-1);

        const scopeCanvas = ref(null);
        let canvasCtx = null;
        let animationFrameId = null;

        let audioCtx = null;
        let masterGain = null;
        let analyser = null;
        let schedulerTimerId = null;

        let nextNoteTime = 0.0;
        let scheduleAheadTime = 0.12; 
        let lookahead = 25.0; 
        let notePointer = 0;

        const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const MIDDLE_C_FREQ = 261.63; 

        const parsedNotes = computed(() => {
            if (!sequenceString.value) return [];
            return sequenceString.value.split('.')
                .filter(token => token.trim() !== "")
                .map(token => {
                    const raw = token.trim();
                    
                    if (raw === '_') {
                        return { isRest: true, semitones: 0, name: "-", frequency: 0, volMultiplier: 0, durMultiplier: 1, isSlide: false };
                    }

                    let semitones = 0;
                    let slideTarget = null;
                    
                    let volMultiplier = 0.7; 
                    let durMultiplier = 1.0;
                    let flagDisplay = "";

                    if (raw.includes('~')) {
                        const slideParts = raw.split('~');
                        semitones = parseInt(slideParts[0], 10) || 0;
                        slideTarget = parseInt(slideParts[1], 10) || 0;
                        flagDisplay = `GLIDE`;
                    } else {
                        semitones = parseInt(raw, 10) || 0;
                    }

                    const volMatch = raw.match(/v([1-9])/);
                    if (volMatch) {
                        volMultiplier = parseInt(volMatch[1], 10) / 10;
                    }

                    const durMatch = raw.match(/d([1-4])/);
                    if (durMatch) {
                        durMultiplier = parseInt(durMatch[1], 10);
                    }

                    const noteIndex = (4 + Math.floor(semitones / 12) * 12 + (semitones % 12) + 12) % 12;
                    const octaveOffset = Math.floor((4 * 12 + semitones) / 12);
                    const name = `${NOTE_NAMES[noteIndex]}${octaveOffset}`;
                    const frequency = MIDDLE_C_FREQ * Math.pow(2, semitones / 12);

                    let slideFreq = null;
                    if (slideTarget !== null) {
                        slideFreq = MIDDLE_C_FREQ * Math.pow(2, slideTarget / 12);
                    }

                    return {
                        isRest: false,
                        semitones,
                        name,
                        frequency,
                        volMultiplier,
                        durMultiplier,
                        isSlide: slideTarget !== null,
                        slideTargetFreq: slideFreq,
                        flagDisplay
                    };
                });
        });

        const loadDefaultSequence = () => {
            sequenceString.value = "5.8v3.12~0.11.7._.8d2.10v9.8._.7.0~12.5.7.5.8.5.7.8.4.5";
            tempo.value = 140;
            gate.value = 0.7;
            waveType.value = "triangle";
            masterVolume.value = 1.0;
        };

        const initAudioEngine = () => {
            if (audioCtx) return;
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();

            masterGain = audioCtx.createGain();
            
            // Map the layout amplitude directly to the active configuration baseline reference (0.6 * user setting)
            masterGain.gain.setValueAtTime(0.6 * masterVolume.value, audioCtx.currentTime);

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;

            masterGain.connect(analyser);
            analyser.connect(audioCtx.destination);
            startOscilloscope();
        };

        // Realtime Volume Multiplier Watcher Matrix tracking parameters
        watch(masterVolume, (newVol) => {
            if (masterGain && audioCtx) {
                // Scale the core gain node cleanly using an absolute ceiling metric
                masterGain.gain.linearRampToValueAtTime(0.6 * newVol, audioCtx.currentTime + 0.02);
            }
        });

        const startOscilloscope = () => {
            if (!scopeCanvas.value) return;
            canvasCtx = scopeCanvas.value.getContext("2d");
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                const width = scopeCanvas.value.width = scopeCanvas.value.clientWidth;
                const height = scopeCanvas.value.height = scopeCanvas.value.clientHeight;
                animationFrameId = requestAnimationFrame(draw);
                
                analyser.getByteTimeDomainData(dataArray);
                canvasCtx.fillStyle = "#09090b";
                canvasCtx.fillRect(0, 0, width, height);
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = isPlaying.value ? "#38bdf8" : "#27272a";
                canvasCtx.beginPath();

                const sliceWidth = width / bufferLength;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * height) / 2;
                    if (i === 0) canvasCtx.moveTo(x, y);
                    else canvasCtx.lineTo(x, y);
                    x += sliceWidth;
                }
                canvasCtx.lineTo(width, height / 2);
                canvasCtx.stroke();
            };
            draw();
        };

        const playDynamicTone = (noteObj, startTime, duration) => {
            if (!audioCtx || noteObj.isRest) return;

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = waveType.value;
            osc.frequency.setValueAtTime(noteObj.frequency, startTime);
            
            if (noteObj.isSlide) {
                osc.frequency.exponentialRampToValueAtTime(noteObj.slideTargetFreq, startTime + duration);
            }

            const targetVolume = noteObj.volMultiplier;
            gainNode.gain.setValueAtTime(0, startTime);
            
            gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + 0.006);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.002);

            osc.connect(gainNode);
            gainNode.connect(masterGain);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        const scheduler = () => {
            while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
                scheduleNote(notePointer, nextNoteTime);
            }
            schedulerTimerId = setTimeout(scheduler, lookahead);
        };

        const scheduleNote = (index, time) => {
            const list = parsedNotes.value;
            if (list.length === 0) return;

            const targetIndex = index % list.length;
            const currentNote = list[targetIndex];
            
            const baseStepDuration = 60.0 / tempo.value;
            const customStepDuration = baseStepDuration * currentNote.durMultiplier;
            const activePlayDuration = customStepDuration * gate.value;

            if (!currentNote.isRest) {
                playDynamicTone(currentNote, time, activePlayDuration);
            }

            const delayTimeMs = Math.max(0, (time - audioCtx.currentTime) * 1000);
            setTimeout(() => {
                if (isPlaying.value) {
                    currentNoteIndex.value = targetIndex;
                }
            }, delayTimeMs);

            nextNoteTime += customStepDuration;
            notePointer++;
        };

        const togglePlayback = () => {
            initAudioEngine();
            if (isPlaying.value) {
                isPlaying.value = false;
                currentNoteIndex.value = -1;
                clearTimeout(schedulerTimerId);
            } else {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                isPlaying.value = true;
                notePointer = 0;
                nextNoteTime = audioCtx.currentTime + 0.02;
                scheduler();
            }
        };

        onMounted(() => {
            nextTick(() => startOscilloscope());
        });

        onUnmounted(() => {
            clearTimeout(schedulerTimerId);
            cancelAnimationFrame(animationFrameId);
            if (audioCtx) audioCtx.close();
        });

        return {
            sequenceString, tempo, gate, waveType, masterVolume,
            isPlaying, currentNoteIndex, parsedNotes,
            scopeCanvas, togglePlayback, loadDefaultSequence
        };
    }
}).mount('#app');
