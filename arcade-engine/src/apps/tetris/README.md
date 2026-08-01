# RG-007 — Tetris Reference Application

## Purpose

RG-007 is the official reference application for **Composite Actors**, **Discrete 10x20 Grid Occupancy**,
**Structural World Mutation**, **Matrix Rotation Systems**, and **Replay Recording** on the ORBIT Arcade Platform.

It validates deterministic manipulation of composite entities and structural line clearances over identical cell sets.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `GridPositionComponent`, `TransformComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for game events |
| **Persistence** (IMP-018) | High score storage & `ReplayRecorder` |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Key Technical Targets

| Feature | Implementation |
|---|---|
| **Composite Actors** | Composite Tetrominoes (I, J, L, O, S, T, Z) + Ghost / Hold / Next pieces |
| **Rotation System** | 90° Matrix Transpose + Reverse with Wall Kick offsets `[0, 1, -1, 2, -2]` |
| **Structural Mutation** | Full row detection, cell array filtration, top row insertion, block actor rebuilding |
| **Replay Infrastructure** | Frame-accurate action recording via `ReplayRecorder` |
| **Speed Progression** | Level-based gravity timing `interval = max(0.05, 0.8 - (level - 1) * 0.07)` |

## Files

| File | Description |
|---|---|
| `TetrisEvents.js` | Event, TetrisState, TetrominoType constants |
| `TetrisTetrominoes.js` | Matrix shapes, colors, 90° rotation utilities |
| `TetrisComponents.js` | GridPosition, Tetromino, Input, GameStatus, Audio components |
| `TetrisActors.js` | Actor factories for Composite Pieces, Locked Blocks, HUD |
| `TetrisGrid.js` | Discrete 10x20 Occupancy Grid, collision, line detection, structural mutation |
| `TetrisSystems.js` | TetrisInputSystem (move, rotate, soft/hard drop, hold) & FallSystem (gravity) |
| `TetrisWorld.js` | World orchestration, line clears, scoring, ReplayRecorder, persistence |
| `TetrisApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/tetris/main.js').then(m => { const r = m.runTetrisApp(); console.log(r); })"
```
