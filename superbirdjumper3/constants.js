export const DEFAULTS = {
    gapSize: 160,
    extremity: 40,
    speedStep: 0,
    enemyIntensity: 0,
    colors: { bird: "#f1c40f", pipe: "#2ecc71", enemy: "#ff4444", bg: "#000000" },
};
export const THEMES = {
    classic: { bird: "#f1c40f", pipe: "#2ecc71", enemy: "#ff4444", bg: "#000000" },
    neon: { bird: "#00ffff", pipe: "#ff00ff", enemy: "#ffff00", bg: "#1a0033" },
    dark: { bird: "#ffffff", pipe: "#444444", enemy: "#ff0000", bg: "#000000" },
    synth: { bird: "#ff0080", pipe: "#00ffcc", enemy: "#ffffff", bg: "#110022" },
};
export const PRESETS = {
    Classic: DEFAULTS,
    Zen: { gapSize: 250, extremity: 20, speedStep: 0, enemyIntensity: 0 },
    Chaos: { gapSize: 160, extremity: 100, speedStep: 20, enemyIntensity: 20 },
    Hard: { gapSize: 100, extremity: 100, speedStep: 50, enemyIntensity: 100 },
};
