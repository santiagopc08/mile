# RG-005 — Pac-Man Reference Application

## Purpose

RG-005 is the official reference application for the **Cognitive Framework**, **Navigation System**,
and **Discrete World** capabilities of the ORBIT Arcade Platform.

It demonstrates autonomous multi-agent decision-making (Ghost AI personalities), grid pathfinding,
tile-based perception, score persistence, and dynamic state switching.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Cognition** (IMP-013) | Perception, Target Calculation, Goal Evaluation |
| **Decision** (IMP-011) | FSM State Switching (`SCATTER`, `CHASE`, `FRIGHTENED`, `RESPAWNING`) |
| **Navigation** (IMP-006) | Discrete maze grid, tile neighbors, warp tunnels |
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `GridPositionComponent`, `TransformComponent`, `NavigationComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for game events |
| **Persistence** (IMP-018) | High score storage & `StateRegistry` |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Ghost AI Personalities

| Ghost | Personality & Target Calculation |
|---|---|
| **Blinky** (Red) | Direct chaser: targets Pac-Man's exact tile `(X, Y)` |
| **Pinky** (Pink) | Ambush: targets 4 tiles ahead of Pac-Man's facing direction |
| **Inky** (Cyan) | Tactical: doubles vector from Blinky to 2 tiles ahead of Pac-Man |
| **Clyde** (Orange) | Shy: chases if distance > 8 tiles, retreats to bottom-left corner if ≤ 8 tiles |

## States & Modes

| State | Description |
|---|---|
| `SCATTER` | Ghosts retreat to assigned corner tiles (timer-based cycle) |
| `CHASE` | Ghosts execute personality-specific target tracking |
| `FRIGHTENED` | Ghosts move blue/vulnerable with random decisions at intersections |
| `RESPAWNING` | Captured ghost returns to Ghost House centre |

## Files

| File | Description |
|---|---|
| `PacmanEvents.js` | Event, GameState, GhostState, GhostType constants |
| `PacmanComponents.js` | GridPosition, Navigation, Input, GhostBehavior, Perception, Status, Audio |
| `PacmanActors.js` | Actor factories for Pac-Man, Blinky, Pinky, Inky, Clyde, Pellets, Fruit, HUD |
| `PacmanMaze.js` | 28x31 Maze layout, wall/walkable logic, warp tunnels |
| `PacmanAI.js` | Target calculations & intersection path decision logic |
| `PacmanSystems.js` | Input, Discrete Movement, Ghost AI, Pellet Collection, Ghost Collision systems |
| `PacmanWorld.js` | World orchestration, mode timers, persistence, audio |
| `PacmanApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/pacman/main.js').then(m => { const r = m.runPacmanApp(); console.log(r); })"
```
