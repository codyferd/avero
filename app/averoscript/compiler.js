window.AveroCompiler = {
    build: function(tokens) {
        let output = [];
        let inJsBlock = false;
        let jsBaseIndent = 0; // Track the 'js' keyword's indent level

        tokens.forEach(t => {
            // Ignore truly empty lines but allow them to exist inside JS blocks
            if (t.type === 'EMPTY' && !inJsBlock) return;

            // 1. EXIT LOGIC: If we are in a JS block and the indent returns to or
            // goes below the 'js' command's level, we exit the block.
            if (inJsBlock && t.trimmed !== "" && t.indent <= jsBaseIndent && t.type !== 'JS_BLOCK') {
                inJsBlock = false;
            }

            // 2. INSIDE JS BLOCK: Strip the base indent so 'let' starts at the correct margin
            if (inJsBlock) {
                // We strip the parent's indent + typically 4 spaces for the block itself
                const cleanLine = t.raw.slice(jsBaseIndent).trimStart();
                output.push(cleanLine);
                return;
            }

            // 3. JS COMMAND START
            if (t.type === 'JS_BLOCK') {
                if (t.trimmed === 'js') {
                    inJsBlock = true;
                    jsBaseIndent = t.indent; // Lock the indentation level
                } else {
                    // Inline: js console.log("hi")
                    output.push(t.trimmed.substring(3).trim());
                }
                return;
            }

            // 4. STANDARD AVERO COMMANDS
            if (t.type === 'VAR_DECL') {
                const isMutable = t.trimmed.startsWith('var!');
                const keyword = isMutable ? 'let' : 'const';
                const content = t.trimmed.replace(/^var!?/, '').trim();
                output.push(`${keyword} ${content};`);
            } else if (t.type === 'REASSIGN') {
                output.push(`${t.trimmed};`);
            } else if (t.type === 'PRINT') {
                const isMutable = t.trimmed.startsWith('print!');
                const content = t.trimmed.replace(/^print!?/, '').trim();
                const log = isMutable ? 'console.warn' : 'console.log';
                output.push(`${log}(${content});`);
            }
        });

        return output.join('\n');
    }
};
