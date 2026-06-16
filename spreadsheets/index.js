const { createApp } = Vue;

createApp({
    data() {
        return {
            vueMode: false, // Standard dynamic visual execution flag structural toggle layout switcher
            activeCellKey: null, // Tracks chosen coordinates reference labels (e.g. 'A1', 'C4')
            sheetSettings: {
                title: 'Avero Master Ledger Operational Sheet Pipeline',
                columnWidth: 130
            },
            // Character axis grid map dimensions (Initialized from A to H)
            cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
            rows: 20,
            // Object map template store index mapping configurations coordinate lookup values
            cells: {}
        };
    },
    methods: {
        // Instantiates structural object components mapping fields securely
        initCellNodeIfMissing(key) {
            if (!this.cells[key]) {
                this.cells[key] = {
                    raw: '',
                    bold: false,
                    color: '#ffffff',
                    fontSize: 13
                };
            }
        },
        mutateCellValue(key, value) {
            this.initCellNodeIfMissing(key);
            this.cells[key].raw = value;
        },
        updateActiveCellRawValue(value) {
            if (this.activeCellKey) {
                this.mutateCellValue(this.activeCellKey, value);
            }
        },
        toggleStyleAttr(attribute) {
            if (!this.activeCellKey) return;
            this.initCellNodeIfMissing(this.activeCellKey);
            this.cells[this.activeCellKey][attribute] = !this.cells[this.activeCellKey][attribute];
        },
        updateStyleAttr(attribute, value) {
            if (!this.activeCellKey) return;
            this.initCellNodeIfMissing(this.activeCellKey);
            this.cells[this.activeCellKey][attribute] = value;
        },
        getCellInlineStyles(key) {
            const cell = this.cells[key];
            if (!cell) return {};
            return {
                fontWeight: cell.bold ? 'bold' : 'normal',
                color: cell.color || '#ffffff',
                fontSize: (cell.fontSize || 13) + 'px'
            };
        },
        clearEntireSheet() {
            if (confirm("Are you certain you want to reset all tracking entries on this spreadsheet configuration?")) {
                this.cells = {};
                this.activeCellKey = null;
            }
        },
        // Dynamically scales columns array mapping based on sidebar count changes (A to Z)
        updateColumnCount(targetCount) {
            let count = parseInt(targetCount);
            if (isNaN(count) || count < 1) count = 1;
            if (count > 26) count = 26; // Enforce safe alphabetical constraint limits
            
            const newCols = [];
            for (let i = 0; i < count; i++) {
                newCols.push(String.fromCharCode(65 + i)); // 65 is ASCII 'A'
            }
            this.cols = newCols;
        },
        
        /**
         * Dynamic Formula Processing Engine Macro Matrix
         * Translates coordinates references and maps evaluation blocks like =SUM() or =AVG()
         */
        evaluateCellOutputValue(key) {
            const cell = this.cells[key];
            if (!cell || !cell.raw) return '';
            
            const formulaString = cell.raw.trim();
            
            // Check if string literal is an executable evaluation parameter directive instruction
            if (formulaString.startsWith('=')) {
                try {
                    return this.executeFormulaMath(formulaString.substring(1));
                } catch (err) {
                    return '#EXPR_ERR';
                }
            }
            return formulaString;
        },

        executeFormulaMath(expression) {
            const normalizedExpr = expression.toUpperCase().trim();
            
            // Regex patterns match formulas like SUM(A1:A5) or AVG(B2:C10)
            const operationMatch = normalizedExpr.match(/^(SUM|AVG)\((([A-Z])([1-9][0-9]?)):(([A-Z])([1-9][0-9]?))\)$/);
            
            if (operationMatch) {
                const command = operationMatch[1];
                const startCol = operationMatch[3];
                const startRow = parseInt(operationMatch[4]);
                const endCol = operationMatch[6];
                const endRow = parseInt(operationMatch[7]);
                
                const collectedValues = this.gatherRangeCellValues(startCol, startRow, endCol, endRow);
                
                if (command === 'SUM') {
                    return collectedValues.reduce((sum, current) => sum + current, 0);
                } else if (command === 'AVG') {
                    if (collectedValues.length === 0) return 0;
                    const totalSum = collectedValues.reduce((sum, current) => sum + current, 0);
                    return (totalSum / collectedValues.length).toFixed(2);
                }
            }
            
            // Fallback for simple standalone coordinate referencing redirection strings (e.g. '=A1')
            const cellRefMatch = normalizedExpr.match(/^([A-Z])([1-9][0-9]?)$/);
            if (cellRefMatch) {
                const targetCoordinate = cellRefMatch[0];
                const targetValue = parseFloat(this.evaluateCellOutputValue(targetCoordinate));
                return isNaN(targetValue) ? this.evaluateCellOutputValue(targetCoordinate) : targetValue;
            }

            return '#INVALID_FORMULA';
        },

        // Helper maps target parameters tracking block array zones
        gatherRangeCellValues(startCol, startRow, endCol, endRow) {
            const valuesList = [];
            const colStartCode = startCol.charCodeAt(0);
            const colEndCode = endCol.charCodeAt(0);
            
            const minCol = Math.min(colStartCode, colEndCode);
            const maxCol = Math.max(colStartCode, colEndCode);
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);

            for (let c = minCol; c <= maxCol; c++) {
                for (let r = minRow; r <= maxRow; r++) {
                    const trackingKey = String.fromCharCode(c) + r;
                    const extractedValue = parseFloat(this.evaluateCellOutputValue(trackingKey));
                    if (!isNaN(extractedValue)) {
                        valuesList.push(extractedValue);
                    }
                }
            }
            return valuesList;
        },

        // State Serialization Output Controller File String Builders
        handleExport() {
            const packoutPayload = {
                settings: this.sheetSettings,
                dimensions: {
                    rows: this.rows,
                    colsCount: this.cols.length
                },
                cells: this.cells
            };
            window.AveroSpreadsheetExporter.exportToJsFile(packoutPayload);
        },

        // Trigger Input Handling Readers
        triggerImport() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const parsedData = window.AveroSpreadsheetExporter.importFromJsText(evt.target.result);
                    if (parsedData && parsedData.settings && parsedData.cells) {
                        this.sheetSettings = parsedData.settings;
                        this.cells = parsedData.cells;
                        
                        // Restore custom workbook dimension scales dynamically if stored in the payload
                        if (parsedData.dimensions) {
                            this.rows = parsedData.dimensions.rows || 20;
                            this.updateColumnCount(parsedData.dimensions.colsCount || 8);
                        }
                        
                        this.activeCellKey = null;
                        this.vueMode = false;
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
    }
}).mount('#app');

/**
 * Isolated Global Spreadsheet Serialization Controller Module
 * Handles inputs/outputs mapping precisely via target AVERO_SPREADSHEET declarations
 */
window.AveroSpreadsheetExporter = {
    exportToJsFile: function(spreadsheetData) {
        const dataString = JSON.stringify(spreadsheetData, null, 2);
        const fileContent = `const AVERO_SPREADSHEET = ${dataString};`;
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `avero-sheet-${Date.now()}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    importFromJsText: function(fileText) {
        try {
            // Isolates active configuration scopes from assignment variables and header strings cleanly
            const startAssignmentIdx = fileText.indexOf('const AVERO_SPREADSHEET =');
            if (startAssignmentIdx === -1) {
                throw new Error("Invalid Format Matrix: Target token variable structure missing configuration records.");
            }

            let extractionZone = fileText.substring(startAssignmentIdx);
            let jsonString = extractionZone.replace(/const\s+AVERO_SPREADSHEET\s*=\s*/, '').trim();

            if (jsonString.endsWith(';')) {
                jsonString = jsonString.slice(0, -1).trim();
            }

            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Export parser system crash error logging telemetry: ", e);
            alert("Failed parsing target configuration profile structure safely. MALFORMED_FILE.");
            return null;
        }
    }
};
