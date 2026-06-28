const { createApp, ref, computed } = Vue;

createApp({
    setup() {
        const activeTab = ref('number');
        const isRolling = ref(false);

        // --- Module A: Numbers State Matrix ---
        const numMin = ref(1);
        const numMax = ref(100);
        const numCount = ref(1);
        const numResults = ref([]);

        const generateRandomNumbers = () => {
            if (numMin.value > numMax.value) {
                const temp = numMin.value;
                numMin.value = numMax.value;
                numMax.value = temp;
            }
            
            // Constrain generation limits
            if (numCount.value < 1) numCount.value = 1;
            if (numCount.value > 50) numCount.value = 50;

            isRolling.value = true;
            const uniqueRange = numMax.value - numMin.value + 1;
            const resultsArray = [];

            // If unique selection count exceeds available range spacing bounds, drop uniqueness filter restriction
            if (numCount.value > uniqueRange) {
                for (let i = 0; i < numCount.value; i++) {
                    resultsArray.push(Math.floor(Math.random() * uniqueRange) + numMin.value);
                }
            } else {
                const pool = new Set();
                while (pool.size < numCount.value) {
                    pool.add(Math.floor(Math.random() * uniqueRange) + numMin.value);
                }
                resultsArray.push(...pool);
            }

            // Sort sequence layout natively
            numResults.value = resultsArray.sort((a, b) => a - b);
            setTimeout(() => { isRolling.value = false; }, 150);
        };

        // --- Module B: Weighted List State Matrix ---
        const newItemName = ref('');
        const newItemWeight = ref(1);
        const listResult = ref('');
        const listItems = ref([]);

        const totalWeight = computed(() => {
            return listItems.value.reduce((sum, item) => sum + (item.weight || 0), 0);
        });

        const calculateProbability = (weight) => {
            if (totalWeight.value === 0) return '0.0';
            return ((weight / totalWeight.value) * 100).toFixed(1);
        };

        const addListItem = () => {
            const name = newItemName.value.trim();
            const weight = parseInt(newItemWeight.value) || 1;
            
            if (!name) return;
            
            listItems.value.push({
                id: Date.now(),
                name,
                weight: weight < 1 ? 1 : weight
            });

            newItemName.value = '';
            newItemWeight.value = 1;
        };

        const removeListItem = (index) => {
            listItems.value.splice(index, 1);
        };

        const sanitizeWeight = (item) => {
            if (item.weight < 1 || isNaN(item.weight)) {
                item.weight = 1;
            }
        };

        const pickWeightedOutcome = () => {
            if (listItems.value.length === 0) return;

            const total = totalWeight.value;
            let targetPoint = Math.random() * total;

            for (const item of listItems.value) {
                targetPoint -= item.weight;
                if (targetPoint <= 0) {
                    listResult.value = item.name;
                    return;
                }
            }
            listResult.value = listItems.value[listItems.value.length - 1].name;
        };

        // Fisher-Yates array permutation logic shuffle algorithm
        const shuffleListItems = () => {
            if (listItems.value.length <= 1) return;
            for (let i = listItems.value.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = listItems.value[i];
                listItems.value[i] = listItems.value[j];
                listItems.value[j] = temp;
            }
        };

        const loadPreset = (presetType) => {
            if (presetType === 'binary') {
                listItems.value = [
                    { id: 1, name: 'Affirmative Absolute (Yes)', weight: 10 },
                    { id: 2, name: 'Negative Exclusion (No)', weight: 10 },
                    { id: 3, name: 'Undetermined Pivot (Maybe)', weight: 3 }
                ];
            } else if (presetType === 'priorities') {
                listItems.value = [
                    { id: 1, name: 'High Priority Urgency', weight: 1 },
                    { id: 2, name: 'Medium Routine Scope', weight: 4 },
                    { id: 3, name: 'Low Backlog Deferral', weight: 8 }
                ];
            }
            listResult.value = '';
        };

        // --- Module C: Quick Utilities State Matrix ---
        const coinResult = ref('HEADS');
        const diceResult = ref(6);
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        const rpgModifier = ref(0);
        const rpgRollResult = ref('');

        const tokenConfig = ref({
            length: 16,
            uppercase: true,
            numbers: true,
            specials: false
        });
        const tokenStringOutput = ref('');

        const diceEmoji = computed(() => {
            return diceEmojis[diceResult.value - 1] || '⚅';
        });

        const flipCoin = () => {
            coinResult.value = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
        };

        const rollDice = () => {
            diceResult.value = Math.floor(Math.random() * 6) + 1;
        };

        const rollRpgDice = (sides) => {
            const roll = Math.floor(Math.random() * sides) + 1;
            const modifierVal = parseInt(rpgModifier.value) || 0;
            const calculation = roll + modifierVal;
            rpgRollResult.value = `Base D${sides} rolled ${roll} ${modifierVal >= 0 ? '+' : ''}${modifierVal} = Total ${calculation}`;
        };

        const generateSecureToken = () => {
            let alphabet = 'abcdefghijklmnopqrstuvwxyz';
            if (tokenConfig.value.uppercase) alphabet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (tokenConfig.value.numbers) alphabet += '0123456789';
            if (tokenConfig.value.specials) alphabet += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            let result = '';
            const lengthTarget = Math.max(4, Math.min(64, tokenConfig.value.length || 16));
            
            for (let i = 0; i < lengthTarget; i++) {
                const randomIdx = Math.floor(Math.random() * alphabet.length);
                result += alphabet.charAt(randomIdx);
            }
            tokenStringOutput.value = result;
        };

        // Bootstrapping operations run logic sequential triggers
        numResults.value = [Math.floor(Math.random() * (numMax.value - numMin.value + 1)) + numMin.value];

        return {
            activeTab, isRolling,
            numMin, numMax, numCount, numResults, generateRandomNumbers,
            newItemName, newItemWeight, listItems, listResult, totalWeight,
            addListItem, removeListItem, sanitizeWeight, calculateProbability, pickWeightedOutcome, shuffleListItems, loadPreset,
            coinResult, diceResult, diceEmoji, flipCoin, rollDice,
            rpgModifier, rpgRollResult, rollRpgDice,
            tokenConfig, tokenStringOutput, generateSecureToken
        };
    }
}).mount('#app');
