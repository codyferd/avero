const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        const gameStarted = ref(false);
        const showLearn = ref(false);
        const totalRounds = ref(2);
        const currentRound = ref(1);
        const scores = ref({ P1: 0, P2: 0 });
        const matchHistory = ref([]);
        const board = ref(Array(9).fill(null));
        const moves = ref([]);
        const winner = ref(null);
        const roundStrategy = ref(null);
        const isXNext = ref(true);

        const isP1TurnToStartX = computed(() => currentRound.value % 2 !== 0);
        const types = ['x', 'y', 'x', 'y', 'z', 'y', 'x', 'y', 'x'];
        const openingMap = { 'xx':'Indian','xy':'Chinese','xz':'American','yx':'Indonesian','yy':'Pakistani','yz':'Nigerian','zx':'Brazilian','zy':'Bangladeshi' };

        const openingName = computed(() => {
            if (moves.value.length < 2) return null;
            return openingMap[types[moves.value[0]] + types[moves.value[1]]] || 'Standard';
        });

        const isDraw = computed(() => !winner.value && !board.value.includes(null));

        const getStrategy = (winChar) => {
            const pMoves = moves.value.filter((m, idx) => idx % 2 === (winChar === 'X' ? 0 : 1));
            const label = winChar === 'X' ? 'Gambit' : 'Victory';
            if (!pMoves.includes(4)) return `Perimeter ${label}`;
            if (pMoves.length === 3) return `Easy ${label}`;
            return `Precision ${label}`;
        };

        const play = (i) => {
            if (board.value[i] || winner.value) return;
            const char = isXNext.value ? 'X' : 'O';
            board.value[i] = char;
            moves.value.push(i);

            const winPaths = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for (let path of winPaths) {
                if (path.every(p => board.value[p] === char)) {
                    winner.value = char;
                    roundStrategy.value = getStrategy(char);
                    const isP1 = (char === 'X' && isP1TurnToStartX.value) || (char === 'O' && !isP1TurnToStartX.value);
                    isP1 ? scores.value.P1++ : scores.value.P2++;
                    return;
                }
            }
            if (!board.value.includes(null)) { scores.value.P1 += 0.5; scores.value.P2 += 0.5; }
            isXNext.value = !isXNext.value;
        };

        const nextRound = () => {
            matchHistory.value.push({
                opening: openingName.value || 'Draw',
                strategy: roundStrategy.value || 'Draw',
                winnerName: winner.value ? (((winner.value === 'X' && isP1TurnToStartX.value) || (winner.value === 'O' && !isP1TurnToStartX.value)) ? 'P1' : 'P2') : 'Draw'
            });
            if (currentRound.value >= totalRounds.value) { location.reload(); return; }
            board.value = Array(9).fill(null); moves.value = []; winner.value = null; roundStrategy.value = null;
            currentRound.value++; isXNext.value = true;
        };

        return { gameStarted, showLearn, totalRounds, currentRound, scores, board, isXNext, play, winner, isDraw, nextRound, openingName, matchHistory, roundStrategy };
    }
}).mount('#app');
