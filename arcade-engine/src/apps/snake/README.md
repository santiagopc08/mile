# RG-002 — Snake Reference Application

## Purpose

RG-002 is the second reference application built on ORBIT Arcade Platform.
It validates the SDK's support for **grid-based worlds**, **discrete movement**,
**event-driven game state**, and **actor lifecycle management**.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `TransformComponent` for grid positions |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for `FoodConsumed`, `GameOver`, etc. |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Architecture

```
SnakeApp (Application)
  ├── SnakeWorld
  │     ├── SnakeController (pure logic)
  │     ├── ActorRegistry (snake segments + food)
  │     ├── EventBus (game events)
  │     └── ViewportManager
  ├── Runtime (tick pipeline)
  └── RenderingSystem (HeadlessRendererAdapter)
```

## Game Rules

1. The snake moves one grid cell per step interval (0.15s).
2. Consuming food increments the score and grows the snake by one segment.
3. Collision with walls or self triggers `GAME_OVER`.
4. The game can be restarted via `SnakeApp.restart()`.

## Files

| File | Description |
|---|---|
| `SnakeActor.js` | `SnakeActorFactory` and `SnakeController` |
| `SnakeWorld.js` | World logic, grid, food spawning, collision |
| `SnakeApp.js` | Application shell |
| `FoodActor.js` | Food actor factory |
| `SnakeEvents.js` | Event name constants |
| `main.js` | Simulation runner for verification |

## Running

```bash
node -e "import('./src/apps/snake/main.js').then(m => { const r = m.runSnakeApp(); console.log(r); })"
```
