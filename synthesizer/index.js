const { createApp, ref, computed, watch, onMounted, onUnmounted, nextTick } = Vue;

createApp({
    setup() {
        const sequenceString = ref("");
        const tempo = ref(140);
        const gate = ref(0.7);
        const waveType = ref("triangle");
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

        // Master compilation index array defining exactly 20 wave profiles
        const waveEngines = [
            'sine', 'triangle', 'sawtooth', 'square', 'piano', 'guitar', 'organ',
            'violin', 'brass', 'flute', 'bell', 'pulse-12', 'pulse-25', 'sub-bass',
            'acid', '8-bit', 'ambient', 'metallic', 'synth-pad', 'percussion'
        ];

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
            masterGain.gain.setValueAtTime(0.6 * masterVolume.value, audioCtx.currentTime);

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;

            masterGain.connect(analyser);
            analyser.connect(audioCtx.destination);
        };

        watch(masterVolume, (newVol) => {
            if (masterGain && audioCtx) {
                masterGain.gain.linearRampToValueAtTime(0.6 * newVol, audioCtx.currentTime + 0.02);
            }
        });

        const startOscilloscope = () => {
            if (!scopeCanvas.value) return;
            canvasCtx = scopeCanvas.value.getContext("2d");

            const draw = () => {
                const width = scopeCanvas.value.width = scopeCanvas.value.clientWidth;
                const height = scopeCanvas.value.height = scopeCanvas.value.clientHeight;
                animationFrameId = requestAnimationFrame(draw);
                
                canvasCtx.fillStyle = "#09090b";
                canvasCtx.fillRect(0, 0, width, height);
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = isPlaying.value ? "#38bdf8" : "#27272a";
                canvasCtx.beginPath();

                if (analyser) {
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    analyser.getByteTimeDomainData(dataArray);

                    const sliceWidth = width / bufferLength;
                    let x = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        const v = dataArray[i] / 128.0;
                        const y = (v * height) / 2;
                        if (i === 0) canvasCtx.moveTo(x, y);
                        else canvasCtx.lineTo(x, y);
                        x += sliceWidth;
                    }
                } else {
                    canvasCtx.moveTo(0, height / 2);
                    canvasCtx.lineTo(width, height / 2);
                }

                canvasCtx.stroke();
            };
            draw();
        };

        const playDynamicTone = (noteObj, startTime, duration) => {
            if (!audioCtx || noteObj.isRest) return;

            const targetVolume = noteObj.volMultiplier;
            const currentEngine = waveType.value;

            // Standard waveforms
            if (['sine', 'triangle', 'sawtooth', 'square'].includes(currentEngine)) {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc.type = currentEngine;
                osc.frequency.setValueAtTime(noteObj.frequency, startTime);
                
                if (noteObj.isSlide) {
                    osc.frequency.exponentialRampToValueAtTime(noteObj.slideTargetFreq, startTime + duration);
                }

                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + 0.006);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.002);

                osc.connect(gainNode);
                gainNode.connect(masterGain);
                osc.start(startTime);
                osc.stop(startTime + duration);
                return;
            }

            // Centralized multi-harmonic additive tracking layout generator
            const playComplexOvertoneNodes = (harmonics, attack, decay, sustain, releaseType) => {
                const voiceGain = audioCtx.createGain();
                voiceGain.gain.setValueAtTime(0, startTime);
                voiceGain.gain.linearRampToValueAtTime(targetVolume, startTime + attack);
                
                if (releaseType === 'exponential') {
                    voiceGain.gain.exponentialRampToValueAtTime(sustain * targetVolume + 0.001, startTime + attack + decay);
                    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                } else {
                    voiceGain.gain.linearRampToValueAtTime(sustain * targetVolume, startTime + attack + decay);
                    voiceGain.gain.linearRampToValueAtTime(0, startTime + duration);
                }

                harmonics.forEach(h => {
                    const osc = audioCtx.createOscillator();
                    const toneGain = audioCtx.createGain();

                    // Emulate custom Pulse Width settings using traditional oscillator alternatives
                    if (h.type === 'pulse-12') {
                        osc.type = 'sawtooth'; 
                    } else if (h.type === 'pulse-25') {
                        osc.type = 'square';
                    } else {
                        osc.type = h.type || 'sine';
                    }
                    
                    const detuneFactor = h.detune || 0;
                    const baseFreq = (noteObj.frequency * h.partial) + detuneFactor;
                    osc.frequency.setValueAtTime(baseFreq, startTime);
                    
                    if (noteObj.isSlide) {
                        osc.frequency.exponentialRampToValueAtTime((noteObj.slideTargetFreq * h.partial) + detuneFactor, startTime + duration);
                    }

                    toneGain.gain.setValueAtTime(h.weight, startTime);
                    if (h.partial > 1 && !h.keepHarmonics) {
                        toneGain.gain.exponentialRampToValueAtTime(h.weight * 0.1 + 0.001, startTime + (duration * 0.6));
                    }

                    osc.connect(toneGain);
                    toneGain.connect(voiceGain);
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                });

                voiceGain.connect(masterGain);
            };

            // Dynamic evaluation switch handling all custom model definitions
            if (currentEngine === 'piano') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.6, type: 'sine' },
                    { partial: 2.0, weight: 0.25, type: 'triangle' },
                    { partial: 3.0, weight: 0.12, type: 'sawtooth' },
                    { partial: 4.0, weight: 0.05, type: 'triangle' }
                ], 0.004, duration * 0.3, 0.2, 'exponential');
            } 
            else if (currentEngine === 'guitar') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.5, type: 'triangle' },
                    { partial: 2.0, weight: 0.3, type: 'triangle' },
                    { partial: 3.0, weight: 0.15, type: 'square' },
                    { partial: 5.0, weight: 0.05, type: 'sine' }
                ], 0.015, duration * 0.4, 0.4, 'exponential');
            } 
            else if (currentEngine === 'organ') {
                playComplexOvertoneNodes([
                    { partial: 0.5, weight: 0.3, type: 'sine', keepHarmonics: true }, 
                    { partial: 1.0, weight: 0.5, type: 'sine', keepHarmonics: true }, 
                    { partial: 2.0, weight: 0.3, type: 'sine', keepHarmonics: true }, 
                    { partial: 3.0, weight: 0.15, type: 'sine', keepHarmonics: true }, 
                    { partial: 4.0, weight: 0.1, type: 'sine', keepHarmonics: true }
                ], 0.04, duration * 0.1, 0.85, 'linear');
            }
            else if (currentEngine === 'violin') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.4, type: 'sawtooth', keepHarmonics: true, detune: 2 },
                    { partial: 2.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -2 },
                    { partial: 3.0, weight: 0.2, type: 'triangle', keepHarmonics: true },
                    { partial: 4.0, weight: 0.1, type: 'sine', keepHarmonics: true }
                ], 0.12, duration * 0.2, 0.7, 'linear');
            }
            else if (currentEngine === 'brass') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.5, type: 'sawtooth', keepHarmonics: true },
                    { partial: 2.0, weight: 0.35, type: 'sawtooth', keepHarmonics: true },
                    { partial: 3.0, weight: 0.15, type: 'square', keepHarmonics: true }
                ], 0.08, duration * 0.15, 0.6, 'linear');
            }
            else if (currentEngine === 'flute') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.8, type: 'sine', keepHarmonics: true },
                    { partial: 2.0, weight: 0.15, type: 'sine', keepHarmonics: true, detune: 4 },
                    { partial: 3.0, weight: 0.05, type: 'triangle', keepHarmonics: true }
                ], 0.06, duration * 0.2, 0.8, 'linear');
            }
            else if (currentEngine === 'bell') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.4, type: 'sine' },
                    { partial: 2.71, weight: 0.25, type: 'sine' }, // Inharmonic partial 1
                    { partial: 3.56, weight: 0.15, type: 'sine' }, // Inharmonic partial 2
                    { partial: 4.0, weight: 0.1, type: 'sine' },
                    { partial: 6.2, weight: 0.1, type: 'sine' }
                ], 0.002, duration * 0.8, 0.01, 'exponential');
            }
            else if (currentEngine === 'pulse-12') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.7, type: 'pulse-12', keepHarmonics: true }
                ], 0.005, duration * 0.2, 0.5, 'exponential');
            }
            else if (currentEngine === 'pulse-25') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.7, type: 'pulse-25', keepHarmonics: true }
                ], 0.005, duration * 0.2, 0.5, 'exponential');
            }
            else if (currentEngine === 'sub-bass') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.9, type: 'sine', keepHarmonics: true },
                    { partial: 2.0, weight: 0.1, type: 'triangle', keepHarmonics: true }
                ], 0.02, duration * 0.1, 0.9, 'linear');
            }
            else if (currentEngine === 'acid') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.6, type: 'sawtooth', keepHarmonics: true, detune: 1 },
                    { partial: 1.01, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -1 }
                ], 0.005, duration * 0.6, 0.1, 'exponential');
            }
            else if (currentEngine === '8-bit') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.6, type: 'square', keepHarmonics: true },
                    { partial: 2.0, weight: 0.3, type: 'triangle', keepHarmonics: true }
                ], 0.001, duration * 0.1, 0.4, 'linear');
            }
            else if (currentEngine === 'ambient') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.5, type: 'sine', keepHarmonics: true },
                    { partial: 1.5, weight: 0.3, type: 'sine', keepHarmonics: true, detune: 2 },
                    { partial: 2.0, weight: 0.2, type: 'sine', keepHarmonics: true, detune: -2 }
                ], 0.25, duration * 0.1, 0.9, 'linear');
            }
            else if (currentEngine === 'metallic') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.3, type: 'sawtooth' },
                    { partial: 3.14, weight: 0.3, type: 'square' },
                    { partial: 5.41, weight: 0.2, type: 'sawtooth' },
                    { partial: 8.21, weight: 0.2, type: 'sine' }
                ], 0.01, duration * 0.4, 0.1, 'exponential');
            }
            else if (currentEngine === 'synth-pad') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: -5 },
                    { partial: 1.0, weight: 0.3, type: 'sawtooth', keepHarmonics: true, detune: 5 },
                    { partial: 2.0, weight: 0.2, type: 'triangle', keepHarmonics: true },
                    { partial: 0.5, weight: 0.2, type: 'sine', keepHarmonics: true }
                ], 0.2, duration * 0.2, 0.8, 'linear');
            }
            else if (currentEngine === 'percussion') {
                playComplexOvertoneNodes([
                    { partial: 1.0, weight: 0.8, type: 'triangle' },
                    { partial: 7.3, weight: 0.2, type: 'square' }
                ], 0.001, duration * 0.15, 0.001, 'exponential');
            }
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
            isPlaying, currentNoteIndex, parsedNotes, waveEngines,
            scopeCanvas, togglePlayback, loadDefaultSequence
        };
    }
}).mount('#app');
