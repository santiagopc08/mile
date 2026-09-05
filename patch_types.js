const fs = require('fs');

const file = fs.readFileSync('src/components/arcade/TankDefenseCanvas.tsx', 'utf8');

// I missed adding Bullet, PowerUp, Particle, and FloatingText to the imported types list from ./tank-defense/types
const importSearch = "import { TankGameState, Tank, TileType, EnemyType, PowerUpType, Direction } from './tank-defense/types';";
const importReplace = "import { TankGameState, Tank, TileType, EnemyType, PowerUpType, Direction, Bullet, PowerUp, Particle, FloatingText } from './tank-defense/types';";

const patched = file.replace(importSearch, importReplace);
fs.writeFileSync('src/components/arcade/TankDefenseCanvas.tsx', patched);
console.log('Fixed imports');
