class WarriorChess {
    constructor() {
        this.reset();
    }

    reset() {
        this._board = [
            ['r','n','b','q','q','b','n','r'],
            ['p','p','p','p','p','p','p','p'],
            Array(8).fill(null), Array(8).fill(null),
            Array(8).fill(null), Array(8).fill(null),
            ['P','P','P','P','P','P','P','P'],
            ['R','N','B','Q','Q','B','N','R']
        ];
        this._turn = 'w';
    }

    turn() { return this._turn; }

    board() {
        return this._board.map(row =>
        row.map(p => p ? { type: p.toLowerCase(), color: p === p.toUpperCase() ? 'w' : 'b' } : null)
        );
    }

    move({ from, to }) {
        const f = this._decode(from);
        const t = this._decode(to);
        const piece = this._board[f.r][f.c];
        const target = this._board[t.r][t.c];

        // 1. Basic Turn Validation
        if (!piece || (this._turn === 'w' && piece !== piece.toUpperCase()) || (this._turn === 'b' && piece === piece.toUpperCase())) return null;

        // 2. FRIENDLY FIRE CHECK: Prevent taking own team
        if (target) {
            const isWhiteMoving = piece === piece.toUpperCase();
            const isWhiteTarget = target === target.toUpperCase();
            if (isWhiteMoving === isWhiteTarget) return null;
        }

        // 3. Warrior Pawn: 1 step forward ONLY
        if (piece.toLowerCase() === 'p') {
            const dir = piece === 'P' ? -1 : 1;
            if (t.r !== f.r + dir || t.c !== f.c) return null;
        }

        // Execute Move
        this._board[t.r][t.c] = piece;
        this._board[f.r][f.c] = null;
        this._turn = this._turn === 'w' ? 'b' : 'w';
        return true;
    }

    isGameOver() {
        const flat = this._board.flat();
        const white = flat.filter(p => p && p === p.toUpperCase()).length;
        const black = flat.filter(p => p && p !== p.toUpperCase()).length;
        if (white === 0) return 'Black Wins by Annihilation';
        if (black === 0) return 'White Wins by Annihilation';
        return false;
    }

    in_check() { return false; }

    _decode(str) {
        return { r: 8 - parseInt(str[1]), c: str.charCodeAt(0) - 97 };
    }
}
