const fs = require('fs');

const file = fs.readFileSync('src/components/arcade/TankDefenseCanvas.tsx', 'utf8');

let patched = file.replace(
    "interface TankDefenseProps {\n    accentColor?: string;\n}\n\nexport function TankDefenseCanvas() {",
    "export function TankDefenseCanvas() {"
);

patched = patched.replace(
    "const [highScore, setHighScore] = useState(0);",
    "const [highScore, setHighScore] = useState(() => {\n        if (typeof window !== 'undefined') {\n            const saved = localStorage.getItem('tank_defense_highscore');\n            return saved ? parseInt(saved, 10) : 0;\n        }\n        return 0;\n    });"
);

patched = patched.replace(
    "    useEffect(() => {\n        const saved = localStorage.getItem('tank_defense_highscore');\n        if (saved) {\n            const val = parseInt(saved, 10);\n            setHighScore(val);\n            stateRef.current.highScore = val;\n        }\n    }, []);\n",
    "    useEffect(() => {\n        stateRef.current.highScore = highScore;\n    }, [highScore]);\n"
);

fs.writeFileSync('src/components/arcade/TankDefenseCanvas.tsx', patched);
