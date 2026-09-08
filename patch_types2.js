const fs = require('fs');

const file = fs.readFileSync('src/components/arcade/TankDefenseCanvas.tsx', 'utf8');

let patched = file.replace(
    "import { Tank, TileType, EnemyType, PowerUpType, Direction } from './tank-defense/types';",
    "import { Tank, TileType, EnemyType, PowerUpType, Direction, Bullet, PowerUp, Particle, FloatingText } from './tank-defense/types';"
);

// We need to restore `interface TankDefenseProps { accentColor?: string; }` and pass `_props: TankDefenseProps` to avoid the error in `src/app/juego/page.tsx`.
patched = patched.replace(
    "export function TankDefenseCanvas() {",
    "export interface TankDefenseProps {\n    accentColor?: string;\n}\n\nexport function TankDefenseCanvas(_props: TankDefenseProps) {"
);

fs.writeFileSync('src/components/arcade/TankDefenseCanvas.tsx', patched);
