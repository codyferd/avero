const { createApp } = Vue;

createApp({
    data() {
        return {
            workspaceMode: 'edit', // Running environment tracking vectors: 'edit' or 'test'
            importModalActive: false,
            activeQuestionIndex: 0,
            
            // Core Quiz Profile Metadata Matrix Attributes
            quizMeta: {
                title: 'Avero Global Systems Routing & Framework Protocol Examination'
            },
            
            // Baseline Reactive Array Questions Core Definitions
            questions: [
                {
                    id: 201,
                    text: 'Which transport layer dynamic interface layer handles non-blocking high-frequency streams inside standalone Canvas matrix blocks safely?',
                    options: ['User Datagram Protocol Matrix Flow', 'Transmission Control Protocol Handshake', 'WebRTC DataChannel Router Multiplexing', 'Bilevel Bitstream Primitives Mapping System'],
                    correctIndex: 2
                },
                {
                    id: 202,
                    text: 'What algorithmic pattern failure is explicitly mitigated by freezing mutations inside Avero Test Mode layout routines runtime parameters?',
                    options: ['Deadlock Configuration Mutex Contention', 'Reactive Pipeline Synchronization Leakage', 'Context Cascading Memory Allocation Collisions', 'State Race Condition Variable Polling Defect'],
                    correctIndex: 3
                },
                {
                    id: 203,
                    text: 'How does the Avero Serialization layer clean text pointers when parsing input constants streams from file system parameters?',
                    options: ['Regex Extraction Index Offset Scanners', 'JSON Token Parsing Stack Bounds Verification', 'Abstract Syntax Tree Declarative Token Isolation', 'Lexical Memory Segment String Splitting Blocks'],
                    correctIndex: 0
                }
            ],
            
            // Testing Runtime Tracking Variables Matrix Arrays
            userAnswers: {}, 
            testSubmitted: false,
            timerTicks: 0,
            timerIntervalPointer: null,
            
            // Metrics Reporting Performance Payload
            scoreReport: {
                correct: 0,
                percentage: 0,
                timeTaken: '00:00'
            }
        };
    },
    computed: {
        activeQuestion() {
            return this.questions[this.activeQuestionIndex] || null;
        },
        formatTimer() {
            const mins = Math.floor(this.timerTicks / 60);
            const secs = this.timerTicks % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    },
    methods: {
        addNewQuestionNode() {
            this.questions.push({
                id: Date.now(),
                text: 'New Question Prompt Vector Text Block Query String',
                options: ['Option Variant Element Alpha', 'Option Variant Element Beta', 'Option Variant Element Gamma', 'Option Variant Element Delta'],
                correctIndex: 0
            });
            this.activeQuestionIndex = this.questions.length - 1;
        },
        deleteQuestionNode(index) {
            this.questions.splice(index, 1);
            if (this.activeQuestionIndex >= this.questions.length) {
                this.activeQuestionIndex = Math.max(0, this.questions.length - 1);
            }
        },
        
        // Runtime Environment Context Router Control
        enterTestMode() {
            if (this.questions.length === 0) {
                alert("Cannot initialize evaluation with completely null questions matrix array.");
                return;
            }
            this.workspaceMode = 'test';
            this.userAnswers = {};
            this.testSubmitted = false;
            this.timerTicks = 0;
            
            // Begin Clock Ticks Counting Sequence Iterations
            clearInterval(this.timerIntervalPointer);
            this.timerIntervalPointer = setInterval(() => {
                this.timerTicks++;
            }, 1000);
        },
        returnToEditMode() {
            clearInterval(this.timerIntervalPointer);
            this.workspaceMode = 'edit';
            this.testSubmitted = false;
            this.userAnswers = {};
        },

        recordUserAnswer(qIdx, oIdx) {
            this.userAnswers[qIdx] = oIdx;
        },

        // Dynamic State-Driven Style Resolver for locked evaluation grids
        getAnswerTestingStyles(qIdx, oIdx) {
            const isSelected = this.userAnswers[qIdx] === oIdx;
            const correctIdx = this.questions[qIdx].correctIndex;

            if (!this.testSubmitted) {
                return isSelected 
                    ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' 
                    : 'border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/60';
            } else {
                // Post-submission visualization mapping pass checks
                if (correctIdx === oIdx) {
                    return 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400 font-bold';
                }
                if (isSelected && correctIdx !== oIdx) {
                    return 'border-red-500/80 bg-red-950/40 text-red-400 font-bold';
                }
                return 'border-zinc-900 bg-zinc-950 text-zinc-600 opacity-60';
            }
        },

        submitFinalizedTestArray() {
            // Verify if unmapped blank values exist before locking calculation pipeline bounds
            const answeredCount = Object.keys(this.userAnswers).length;
            if (answeredCount < this.questions.length) {
                if (!confirm(`Warning: You have only assigned answers to ${answeredCount}/${this.questions.length} elements inside the question node stream. Proceed with processing evaluations regardless?`)) {
                    return;
                }
            }

            clearInterval(this.timerIntervalPointer);
            this.testSubmitted = true;

            // Compile scoring profile logs telemetry metrics
            let correctTally = 0;
            this.questions.forEach((q, idx) => {
                if (this.userAnswers[idx] === q.correctIndex) {
                    correctTally++;
                }
            });

            this.scoreReport = {
                correct: correctTally,
                percentage: Math.round((correctTally / this.questions.length) * 100),
                timeTaken: this.formatTimer
            };
        },

        // Exporter Module Wrapper Object Orchestration Interface
        handleExport() {
            const outputBundle = {
                meta: this.quizMeta,
                questions: this.questions
            };
            window.AveroQuizSerializer.exportToJsFile(outputBundle);
        },
        triggerImportModal() {
            this.importModalActive = true;
        },
        executeFilePickerStream(targetSubMode) {
            this.importModalActive = false;
            
            const inputNode = document.createElement('input');
            inputNode.type = 'file';
            inputNode.accept = '.js';
            
            inputNode.onchange = (e) => {
                const targetedFileRef = e.target.files[0];
                if (!targetedFileRef) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const parsedStructure = window.AveroQuizSerializer.importFromJsText(evt.target.result);
                    if (parsedStructure && parsedStructure.meta && Array.isArray(parsedStructure.questions)) {
                        this.quizMeta = parsedStructure.meta;
                        this.questions = parsedStructure.questions;
                        this.activeQuestionIndex = 0;
                        
                        if (targetSubMode === 'test') {
                            this.enterTestMode();
                        } else {
                            this.returnToEditMode();
                        }
                    }
                };
                reader.readAsText(targetedFileRef);
            };
            inputNode.click();
        }
    }
}).mount('#app');

/**
 * Isolated Global Quiz Serialization Controller Module System Engine Object
 * Handles configuration stream flows matching AVERO_QUIZ code assignment rules.
 */
window.AveroQuizSerializer = {
    exportToJsFile: function(quizWorkspaceData) {
        const structuralDataString = JSON.stringify(quizWorkspaceData, null, 2);
        const fileContentBlock = `const AVERO_QUIZ = ${structuralDataString};`;
        
        const blob = new Blob([fileContentBlock], { type: 'application/javascript' });
        const downloadUrlPointer = URL.createObjectURL(blob);
        
        const anchorNode = document.createElement('a');
        anchorNode.href = downloadUrlPointer;
        anchorNode.download = `avero-quiz-${Date.now()}.js`;
        document.body.appendChild(anchorNode);
        anchorNode.click();
        document.body.removeChild(anchorNode);
        URL.revokeObjectURL(downloadUrlPointer);
    },

    importFromJsText: function(rawFileTextString) {
        try {
            const startAssignmentIdx = rawFileTextString.indexOf('const AVERO_QUIZ =');
            if (startAssignmentIdx === -1) {
                throw new Error("Invalid Format Structure: Target tokens code assignments context missing records.");
            }

            let extractionZone = rawFileTextString.substring(startAssignmentIdx);
            let jsonString = extractionZone.replace(/const\s+AVERO_QUIZ\s*=\s*/, '').trim();

            if (jsonString.endsWith(';')) {
                jsonString = jsonString.slice(0, -1).trim();
            }

            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Export parser quiz system crash error logging telemetry: ", e);
            alert("Failed parsing quiz data configuration structure safely. MALFORMED_FILE.");
            return null;
        }
    }
};
