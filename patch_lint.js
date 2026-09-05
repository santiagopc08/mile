const fs = require('fs');

const file = fs.readFileSync('src/components/arcade/TankDefenseCanvas.tsx', 'utf8');

let patched = file.replace(
    "import { Volume2, VolumeX, Shield, Zap, RotateCcw, Tv, Crosshair, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame } from 'lucide-react';",
    "import { Volume2, VolumeX, Tv, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame } from 'lucide-react';"
);

patched = patched.replace(
    "import { TankGameState, Tank, TileType, EnemyType, PowerUpType, Direction, Bullet, PowerUp, Particle, FloatingText } from './tank-defense/types';",
    "import { Tank, TileType, EnemyType, PowerUpType, Direction } from './tank-defense/types';"
);

// We need to keep accentColor as it's part of Props destructuring, we can just remove the default or use it
// Wait, the lint error says `accentColor` is defined but never used. Let's just remove it.
patched = patched.replace(
    "export function TankDefenseCanvas({ accentColor = '#00f0ff' }: TankDefenseProps) {",
    "export function TankDefenseCanvas(_props: TankDefenseProps) {"
);

// weaponLevel is not used, wait... wait, it is used in setWeaponLevel in startNewGame. Wait, no.
// Let's remove the destructure from state: `const [weaponLevel, setWeaponLevel] = useState(1);`
// wait, we need it for React re-render? We don't render weapon level in HUD. Let's just remove `weaponLevel` from useState.
patched = patched.replace(
    "const [weaponLevel, setWeaponLevel] = useState(1);",
    "const [, setWeaponLevel] = useState(1);"
);

fs.writeFileSync('src/components/arcade/TankDefenseCanvas.tsx', patched);
