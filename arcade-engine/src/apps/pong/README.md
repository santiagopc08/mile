# RG-003 — Pong Reference Application

## Purpose

RG-003 is the third reference application built on ORBIT Arcade Platform.
It validates the SDK's support for **continuous real-time movement**, **collision detection**,
**simple AI**, **game state transitions**, **audio cues**, and **coordinated multi-System updates**.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `TransformComponent`, `VelocityComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for game events |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` continuous tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Architecture

```
PongApp (Application)
  ├── PongWorld
  │     ├── PaddleInputSystem
  │     ├── AISystem
  │     ├── BallMovementSystem
  │     ├── CollisionSystem
  │     ├── ActorRegistry (paddles, ball, HUD)
  │     ├── EventBus (game events)
  │     └── ViewportManager
  ├── Runtime (continuous tick pipeline)
  └── RenderingSystem (HeadlessRendererAdapter)
```

## Game Rules

1. Continuous plane — no grid, no tilemap.
2. Ball moves with velocity integration (`position += velocity × dt`).
3. Ball bounces off top/bottom walls (Y reflection).
4. Ball bounces off paddles (X reflection + spin from hit position).
5. Ball speed increases slightly on each paddle hit (×1.05).
6. Goal scored when ball passes left/right boundary.
7. Brief 0.5s cooldown after goal before next round.
8. First to 5 points wins the match.
9. Pause/Resume supported.

## Game States

| State | Description |
|---|---|
| `READY` | Initial state before first round |
| `PLAYING` | Active gameplay |
| `PAUSED` | Gameplay frozen |
| `GOAL` | Cooldown after scoring |
| `FINISHED` | Match ended — winner determined |

## Events

| Event | Payload |
|---|---|
| `Pong.RoundStarted` | — |
| `Pong.BallSpawned` | — |
| `Pong.GoalScored` | `scoredBy`, `playerScore`, `aiScore` |
| `Pong.RoundEnded` | `playerScore`, `aiScore` |
| `Pong.MatchEnded` | `winner`, `playerScore`, `aiScore` |
| `Pong.GamePaused` | — |
| `Pong.GameResumed` | — |

## Audio Cues

- `wall_hit` — ball bounces off top/bottom wall
- `paddle_hit` — ball bounces off a paddle
- `goal` — ball passes boundary

## Files

| File | Description |
|---|---|
| `PongComponents.js` | Game-specific components (Collider, AI, Input, Score, Audio) |
| `PongActors.js` | Actor factories + field constants |
| `PongSystems.js` | Input, AI, Movement, Collision systems |
| `PongWorld.js` | World orchestration, state machine |
| `PongApp.js` | Application shell |
| `PongEvents.js` | Event & state constants |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/pong/main.js').then(m => { const r = m.runPongApp(); console.log(r); })"
```
