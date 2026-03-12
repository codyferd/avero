window.AveroLexer = {
    tokenize: function(source) {
        return source.split('\n').map((line, index) => {
            const trimmed = line.trim();
            // Calculate leading spaces
            const indent = line.search(/\S|$/);
            let type = 'UNKNOWN';

            if (trimmed.startsWith('var')) type = 'VAR_DECL';
            else if (trimmed.startsWith('print')) type = 'PRINT';
            else if (trimmed.startsWith('js')) type = 'JS_BLOCK';
            else if (trimmed.includes('=') && !trimmed.startsWith('var')) type = 'REASSIGN';
            else if (trimmed === "") type = 'EMPTY';

            return {
                raw: line,
                trimmed,
                type,
                indent,
                lineNum: index + 1
            };
        });
    }
};

