// types.js
window.AveroTable = {
    symbols: {},
    clear() { this.symbols = {}; }
};

window.AveroTypeChecker = {
    validate(tokens) { // <--- This must be named 'validate'
        tokens.forEach(t => {
            if (t.type === 'VAR_DECL') {
                const isMutable = t.trimmed.startsWith('var!');
                const content = t.trimmed.replace(/^var!?/, '').trim();
                const [name, val] = content.split('=').map(s => s.trim());
                const inferred = this.infer(val);
                if (AveroTable.symbols[name]) throw new Error(`'${name}' is already defined.`);
                AveroTable.symbols[name] = { type: inferred, mutable: isMutable };
            }
            if (t.type === 'REASSIGN') {
                const [name, val] = t.trimmed.split('=').map(s => s.trim());
                const existing = AveroTable.symbols[name];
                if (!existing) throw new Error(`'${name}' is not defined.`);
                if (!existing.mutable) throw new Error(`'${name}' is immutable (use var!).`);
                if (existing.type !== this.infer(val)) throw new Error(`Type mismatch for '${name}'`);
            }
        });
    },
    infer(val) {
        if (/^".*"$/.test(val)) return 'STRING';
        if (!isNaN(val) && val !== "") return 'NUMBER';
        return 'BOOLEAN';
    }
};

