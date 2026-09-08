const fs = require('fs');

const file = fs.readFileSync('src/components/arcade/TankDefenseCanvas.tsx', 'utf8');

let patched = file.replace(
    "const [mutedState, setMutedState] = useState(false);",
    "const [mutedState, setMutedState] = useState(() => loadMutedPreference());"
);

patched = patched.replace(
    "setMutedState(loadMutedPreference());\n        const saved = localStorage.getItem('tank_defense_highscore');",
    "const saved = localStorage.getItem('tank_defense_highscore');"
);

patched = patched.replace(
    "export function TankDefenseCanvas(_props: TankDefenseProps) {",
    "export function TankDefenseCanvas() {"
);

patched = patched.replace(
    "    }, [crtEnabled, spawnEnemy]);",
    "    }, [crtEnabled, spawnEnemy, applyPowerUp, damageTileAt, loadMap]);"
);

// We need to wrap applyPowerUp and damageTileAt in useCallback
patched = patched.replace(
    "const damageTileAt = (col: number, row: number, heavy: boolean) => {",
    "const damageTileAt = useCallback((col: number, row: number, heavy: boolean) => {"
);
// damageTileAt ends at line 223, wait, I can just use a regex or string split.
patched = patched.replace(
    "        }\n    };\n\n    const spawnEnemy = useCallback(() => {",
    "        }\n    }, []);\n\n    const spawnEnemy = useCallback(() => {"
);

patched = patched.replace(
    "const applyPowerUp = (type: PowerUpType) => {",
    "const applyPowerUp = useCallback((type: PowerUpType) => {"
);
patched = patched.replace(
    "        }\n    };\n\n    // ── MAIN 60 FPS GAME LOOP",
    "        }\n    }, []);\n\n    // ── MAIN 60 FPS GAME LOOP"
);

fs.writeFileSync('src/components/arcade/TankDefenseCanvas.tsx', patched);
