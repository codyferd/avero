/**
 * AveroScript app.js - The Orchestrator
 */
window.AveroScript = {
    compile: function(source) {
        if (!source || source.trim() === "") return "";

        try {
            // 1. Reset the Symbol Table for a clean run
            AveroTable.clear();

            // 2. Lexical Analysis (Now detects indentation for js blocks)
            const tokens = AveroLexer.tokenize(source);

            // 3. Static Type & Mutability Checking
            AveroTypeChecker.validate(tokens);

            // 4. Final Code Generation
            return AveroCompiler.build(tokens);

        } catch (error) {
            console.error("AveroScript Compilation Error:", error.message);
            return `console.error("AVEROSCRIPT ERROR: ${error.message}");`;
        }
    }
};

