# RG-004 — Breakout Reference Application

## Purpose

RG-004 validates that the SDK supports **dynamic scene mutation** during runtime.
Actors (bricks, power-ups) are created and destroyed mid-game without compromising
the stability of the Runtime, ActorRegistry, or rendering pipeline.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` — dynamic register/unregister |
| **Movement** (IMP-009) | `TransformComponent`, `VelocityComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for 10 game event types |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` continuous tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Key Validation Points

| Validation | How |
|---|---|
| ✔ Actor destruction | Bricks removed from `ActorRegistry` on destroy |
| ✔ Dynamic spawn | Power-ups spawned from destroyed brick positions |
| ✔ Mutable scenes | Brick count changes every frame; registry stays stable |
| ✔ Gameplay rules | Health, scoring, lives, level progression |
| ✔ Audio | Cue markers for hits, destroys, wall bounces |
| ✔ HUD | `GameStatusComponent` tracks score/lives/level |
| ✔ Level change | 3 levels with increasing difficulty |

## Architecture

```
BreakoutApp (Application)
  ├── BreakoutWorld
  │     ├── PaddleInputSystem
  │     ├── BallMovementSystem
  │     ├── PowerupMovementSystem
  │     ├── WallCollisionSystem
  │     ├── PaddleCollisionSystem
  │     ├── BrickCollisionSystem
  │     ├── PowerupCollectionSystem
  │     ├── ActorRegistry (paddle, ball, HUD, bricks[], powerups[])
  │     ├── EventBus
  │     └── ViewportManager
  ├── Runtime
  └── RenderingSystem (HeadlessRendererAdapter)
```

## Game States

| State | Description |
|---|---|
| `READY` | Before initialization |
| `PLAYING` | Active gameplay |
| `PAUSED` | Frozen |
| `LEVEL_TRANSITION` | 0.5s cooldown between levels |
| `GAME_OVER` | Lives exhausted |
| `VICTORY` | All levels completed |

## Events

| Event | Payload |
|---|---|
| `Breakout.BrickHit` | `brickId`, `tier`, `destroyed` |
| `Breakout.BrickDestroyed` | `brickId`, `score`, `remaining` |
| `Breakout.PowerupSpawned` | `type`, `x`, `y` |
| `Breakout.PowerupCollected` | `type` |
| `Breakout.LifeLost` | `livesRemaining` |
| `Breakout.LevelCompleted` | `level` |
| `Breakout.GameCompleted` | `score` |
| `Breakout.BallSpawned` | `level` |

## Files

| File | Description |
|---|---|
| `BreakoutEvents.js` | Event & state constants |
| `BreakoutComponents.js` | Collider, Health, Input, GameStatus, Powerup, Audio, BrickData |
| `BreakoutActors.js` | Factories + field constants |
| `BreakoutLevels.js` | Level layout definitions |
| `BreakoutSystems.js` | 7 systems (Input, Movement, Wall, Paddle, Brick, Powerup) |
| `BreakoutWorld.js` | World orchestration, state machine, level management |
| `BreakoutApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/breakout/main.js').then(m => { const r = m.runBreakoutApp(); console.log(r); })"
```
