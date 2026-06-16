const { createApp, ref, computed, reactive, watch, onMounted } = Vue;

// ================= THE EXPANDED CONVERSION FACTOR MATRIX =================
// Multipliers determine ratio equations mapping back to a baseline SI unit node.
const conversionMatrix = {
    length: {
        label: "Length",
        defaultSource: "m",
        defaultTarget: "km",
        units: {
            m:   { name: "Meter (SI Base)", symbol: "m", ratio: 1 },
            km:  { name: "Kilometer", symbol: "km", ratio: 1000 },
            cm:  { name: "Centimeter", symbol: "cm", ratio: 0.01 },
            mm:  { name: "Millimeter", symbol: "mm", ratio: 0.001 },
            um:  { name: "Micrometer", symbol: "µm", ratio: 0.000001 },
            nm:  { name: "Nanometer", symbol: "nm", ratio: 0.000000001 },
            inch:{ name: "Inch (Imperial)", symbol: "in", ratio: 0.0254 },
            foot:{ name: "Foot (Imperial)", symbol: "ft", ratio: 0.3048 },
            yard:{ name: "Yard", symbol: "yd", ratio: 0.9144 },
            mile:{ name: "Mile (Imperial)", symbol: "mi", ratio: 1609.344 },
            nmi: { name: "Nautical Mile", symbol: "NM", ratio: 1852 }
        }
    },
    mass: {
        label: "Mass / Weight",
        defaultSource: "kg",
        defaultTarget: "g",
        units: {
            kg:  { name: "Kilogram (SI Base)", symbol: "kg", ratio: 1 },
            g:   { name: "Gram", symbol: "g", ratio: 0.001 },
            mg:  { name: "Milligram", symbol: "mg", ratio: 0.000001 },
            ug:  { name: "Microgram", symbol: "µg", ratio: 0.000000001 },
            ton: { name: "Metric Ton", symbol: "t", ratio: 1000 },
            lb:  { name: "Pound (Imperial)", symbol: "lb", ratio: 0.45359237 },
            oz:  { name: "Ounce (Imperial)", symbol: "oz", ratio: 0.028349523 },
            st:  { name: "Stone", symbol: "st", ratio: 6.35029318 },
            ct:  { name: "Carat", symbol: "ct", ratio: 0.0002 }
        }
    },
    volume: {
        label: "Volume",
        defaultSource: "l",
        defaultTarget: "ml",
        units: {
            l:   { name: "Liter", symbol: "L", ratio: 1 },
            ml:  { name: "Milliliter", symbol: "mL", ratio: 0.001 },
            m3:  { name: "Cubic Meter (SI Base)", symbol: "m³", ratio: 1000 },
            cm3: { name: "Cubic Centimeter", symbol: "cm³", ratio: 0.001 },
            gal: { name: "Gallon (US Customary)", symbol: "gal", ratio: 3.78541178 },
            qt:  { name: "Quart (US Customary)", symbol: "qt", ratio: 0.946352945 },
            pt:  { name: "Pint (US Customary)", symbol: "pt", ratio: 0.473176473 },
            cup: { name: "Cup (US Customary)", symbol: "cp", ratio: 0.24 },
            floz:{ name: "Fluid Ounce (US)", symbol: "fl oz", ratio: 0.02957353 }
        }
    },
    area: {
        label: "Area Matrix",
        defaultSource: "m2",
        defaultTarget: "ha",
        units: {
            m2:  { name: "Square Meter (SI Base)", symbol: "m²", ratio: 1 },
            km2: { name: "Square Kilometer", symbol: "km²", ratio: 1000000 },
            cm2: { name: "Square Centimeter", symbol: "cm²", ratio: 0.0001 },
            ha:  { name: "Hectare", symbol: "ha", ratio: 10000 },
            acre:{ name: "Acre", symbol: "ac", ratio: 4046.85642 },
            sqft:{ name: "Square Foot", symbol: "ft²", ratio: 0.09290304 },
            sqin:{ name: "Square Inch", symbol: "in²", ratio: 0.00064516 }
        }
    },
    temperature: {
        label: "Temperature",
        defaultSource: "c",
        defaultTarget: "f",
        isSpecial: true, 
        units: {
            c: { name: "Celsius (SI Derived)", symbol: "°C" },
            k: { name: "Kelvin (SI Base)", symbol: "K" },
            f: { name: "Fahrenheit", symbol: "°F" },
            r: { name: "Rankine", symbol: "°R" }
        }
    },
    currency: {
        label: "World Currencies",
        defaultSource: "USD",
        defaultTarget: "JPY",
        units: {
            // --- Original 12 Currencies ---
            EUR: { name: "Euro", symbol: "€", ratio: 1.0000 },
            USD: { name: "US Dollar", symbol: "$", ratio: 1.1608 }, 
            GBP: { name: "British Pound Sterling", symbol: "£", ratio: 0.8542 },
            JPY: { name: "Japanese Yen", symbol: "¥", ratio: 185.6490 }, 
            CAD: { name: "Canadian Dollar", symbol: "C$", ratio: 1.4811 },
            AUD: { name: "Australian Dollar", symbol: "A$", ratio: 1.6324 },
            CHF: { name: "Swiss Franc", symbol: "CHF", ratio: 0.9825 },
            CNY: { name: "Chinese Yuan", symbol: "¥", ratio: 7.9420 },
            INR: { name: "Indian Rupee", symbol: "₹", ratio: 93.1250 },
            MXN: { name: "Mexican Peso", symbol: "$", ratio: 19.8420 },
            BRL: { name: "Brazilian Real", symbol: "R$", ratio: 5.4210 },
            ZAR: { name: "South African Rand", symbol: "R", ratio: 20.1450 },

            // --- Added 18 New Supported Currencies ---
            AED: { name: "United Arab Emirates Dirham", symbol: "د.إ", ratio: 4.2633 },
            ARS: { name: "Argentine Peso", symbol: "$", ratio: 1042.5000 },
            CLP: { name: "Chilean Peso", symbol: "$", ratio: 1092.4500 },
            COP: { name: "Colombian Peso", symbol: "$", ratio: 4520.1500 },
            CZK: { name: "Czech Koruna", symbol: "Kč", ratio: 25.2130 },
            DKK: { name: "Danish Krone", symbol: "kr", ratio: 7.4590 },
            HKD: { name: "Hong Kong Dollar", symbol: "HK$", ratio: 9.0645 },
            HUF: { name: "Hungarian Forint", symbol: "Ft", ratio: 391.8500 },
            IDR: { name: "Indonesian Rupiah", symbol: "Rp", ratio: 18950.0000 },
            ILS: { name: "Israeli New Shekel", symbol: "₪", ratio: 4.3120 },
            KRW: { name: "South Korean Won", symbol: "₩", ratio: 1595.2000 },
            MYR: { name: "Malaysian Ringgit", symbol: "RM", ratio: 5.4510 },
            NOK: { name: "Norwegian Krone", symbol: "kr", ratio: 12.3520 },
            NZD: { name: "New Zealand Dollar", symbol: "NZ$", ratio: 1.9124 },
            PHP: { name: "Philippine Peso", symbol: "₱", ratio: 67.8200 },
            PLN: { name: "Polish Zloty", symbol: "zł", ratio: 4.3110 },
            SGD: { name: "Singapore Dollar", symbol: "S$", ratio: 1.5642 },
            TRY: { name: "Turkish Lira", symbol: "₺", ratio: 37.8430 }
        }
    }
};

createApp({
    setup() {
        const currentCategory = ref('currency');
        const sourceUnit = ref('USD');
        const targetUnit = ref('JPY');
        
        const sourceValue = ref(159);
        const targetValue = ref(0);

        const currencyApiState = reactive({
            loading: false,
            error: null
        });

        const currentUnits = computed(() => {
            return conversionMatrix[currentCategory.value].units;
        });

        const currentExchangeRate = computed(() => {
            if (currentCategory.value !== 'currency') return 1;
            const units = conversionMatrix.currency.units;
            const fromRate = units[sourceUnit.value].ratio;
            const toRate = units[targetUnit.value].ratio;
            return toRate / fromRate;
        });

        const transformTemperature = (value, from, to) => {
            let kelvin;
            // Phase 1: Establish absolute Kelvin baseline
            if (from === 'k') kelvin = value;
            else if (from === 'c') kelvin = value + 273.15;
            else if (from === 'f') kelvin = (value - 32) * 5 / 9 + 273.15;
            else if (from === 'r') kelvin = value * 5 / 9;

            // Phase 2: Derive conversion projections
            if (to === 'k') return kelvin;
            if (to === 'c') return kelvin - 273.15;
            if (to === 'f') return (kelvin - 273.15) * 9 / 5 + 32;
            if (to === 'r') return kelvin * 9 / 5;
            return value;
        };

        const calculateTransformation = (isForwardDirection = true) => {
            const category = conversionMatrix[currentCategory.value];
            
            if (category.isSpecial) {
                if (isForwardDirection) {
                    if (sourceValue.value === '' || sourceValue.value === null) return;
                    targetValue.value = Number(transformTemperature(sourceValue.value, sourceUnit.value, targetUnit.value).toFixed(4));
                } else {
                    if (targetValue.value === '' || targetValue.value === null) return;
                    sourceValue.value = Number(transformTemperature(targetValue.value, targetUnit.value, sourceUnit.value).toFixed(4));
                }
                return;
            }

            const units = category.units;
            const fromRatio = units[sourceUnit.value].ratio;
            const toRatio = units[targetUnit.value].ratio;

            if (isForwardDirection) {
                if (sourceValue.value === '' || sourceValue.value === null) { targetValue.value = ''; return; }
                const baseValue = sourceValue.value * (category.label === "World Currencies" ? 1 / fromRatio : fromRatio);
                const computedOutput = baseValue * (category.label === "World Currencies" ? toRatio : 1 / toRatio);
                targetValue.value = Number(computedOutput.toFixed(category.label === "World Currencies" ? 2 : 5));
            } else {
                if (targetValue.value === '' || targetValue.value === null) { sourceValue.value = ''; return; }
                const baseValue = targetValue.value * (category.label === "World Currencies" ? 1 / toRatio : toRatio);
                const computedInput = baseValue * (category.label === "World Currencies" ? fromRatio : 1 / fromRatio);
                sourceValue.value = Number(computedInput.toFixed(category.label === "World Currencies" ? 2 : 5));
            }
        };

        const switchCategory = (categoryKey) => {
            currentCategory.value = categoryKey;
            const targetConfig = conversionMatrix[categoryKey];
            sourceUnit.value = targetConfig.defaultSource;
            targetUnit.value = targetConfig.defaultTarget;
            sourceValue.value = categoryKey === 'currency' ? 159 : 1;
            calculateTransformation(true);
        };

        const syncCurrencyRates = async () => {
            currencyApiState.loading = true;
            currencyApiState.error = null;
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/EUR');
                if (!res.ok) throw new Error("Central exchange telemetry connection dropped.");
                
                const payload = await res.json();
                if (!payload || !payload.rates) throw new Error("API return data payload structure is invalid.");

                Object.keys(conversionMatrix.currency.units).forEach(ticker => {
                    if (payload.rates[ticker]) {
                        conversionMatrix.currency.units[ticker].ratio = payload.rates[ticker];
                    }
                });
                
                calculateTransformation(true);
            } catch (err) {
                currencyApiState.error = err.message || "Network frame processing error.";
            } finally {
                currencyApiState.loading = false;
            }
        };

        watch(currentCategory, (newCat) => {
            if (newCat === 'currency') syncCurrencyRates();
        });

        onMounted(() => {
            if (currentCategory.value === 'currency') {
                syncCurrencyRates();
            } else {
                calculateTransformation(true);
            }
        });

        return {
            conversionMatrix,
            currentCategory,
            sourceUnit,
            targetUnit,
            sourceValue,
            targetValue,
            currencyApiState,
            currentUnits,
            currentExchangeRate,
            switchCategory,
            calculateTransformation
        };
    }
}).mount('#app');
