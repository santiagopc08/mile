# Plan to refactor TankDefenseCanvas.tsx

The `TankDefenseCanvas.tsx` file is overly long (1018 lines) and contains everything from constants, type definitions, initial state generation, game logic (updating particles, powerups, tank movement, bullet logic), rendering (canvas API draw calls), to the actual React component markup and hooks.

We will refactor it by extracting pure logic and constants out into separate files to improve maintainability, whilst preserving all functionality.

**Strategy:**
1. Extract types and constants to `src/components/arcade/tank/constants.ts` and `src/components/arcade/tank/types.ts`.
2. Extract the main update loop logic (modifying `stateRef.current` state) to a pure function or hook in `src/components/arcade/tank/gameLogic.ts`.
3. Extract the canvas render logic to a pure function in `src/components/arcade/tank/renderer.ts`.
4. Update `TankDefenseCanvas.tsx` to import and use these.

Wait, since it's a React component relying heavily on a mutable `stateRef.current`, passing this reference around to external pure functions is perfectly fine and avoids heavy re-writes. Let's do exactly that.

Files to create:
- `src/components/arcade/tank/types.ts`: `Tank`, `Bullet`, `PowerUp`, `Particle`, `FloatingText`, `TileType`, `Direction`, `EnemyType`, `PowerUpType`, `GameState`
- `src/components/arcade/tank/constants.ts`: `MAP_COLS`, `MAP_ROWS`, `TILE_SIZE`, `V_WIDTH`, `V_HEIGHT`, `BOARD_X`, `BOARD_Y`, `DIR_VECTORS`
- `src/components/arcade/tank/GameState.ts`: Define the interface for the huge state object.
- `src/components/arcade/tank/gameLogic.ts`: Functions like `updateGameLogic`, `spawnEnemy`, `fireBullet`, `applyPowerUp`, `checkTileCollision`, `damageTileAt`.
- `src/components/arcade/tank/renderer.ts`: `renderGameScene` function.

Wait, it might be safer to keep the `TankDefenseCanvas.tsx` self-contained in its logic by using a custom hook (`useTankGameLogic.ts`) or just refactoring it into smaller components.

But actually, I can also extract the HUD and UI elements into subcomponents, or just extract constants and types and the huge `renderScene` and `updateLogic` loops. Let me review the size of those parts.

The `loop` function alone is lines 336 to 750 (414 lines!).
Inside `loop`, lines 356 to 577 is `update` (221 lines).
Lines 578 to 742 is `render` (164 lines).

Extracting `updateLogic(dt, stateRef, methods...)` and `renderScene(ctx, stateRef.current, ...)` into separate files will remove ~400 lines.
Extracting types and constants will remove ~70 lines.
This will drastically cut the size of `TankDefenseCanvas.tsx`.

Let's use `src/components/arcade/tankDefense/` as a directory to group these.
