# RG-006 — Asteroids Reference Application

## Purpose

RG-006 is the official reference application for **Continuous World Physics**, **Entity Pooling**,
**Toroidal World Wrapping**, **Hierarchical Fragmentation**, and **Particle Systems** on the ORBIT Arcade Platform.

It validates high entity count stability and zero-GC allocation pooling under continuous physics conditions.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `TransformComponent`, `VelocityComponent`, `RotationComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for game events |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` continuous tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Key Technical Targets

| Feature | Implementation |
|---|---|
| **Continuous Physics** | Angular rotation + thrust acceleration + drag damping |
| **World Wrapping** | Toroidal space wrapping (`0 <= x <= 100`, `0 <= y <= 100`) |
| **Entity Pooling** | `EntityPool` for Bullets (30) and Particles (60) with zero GC churn |
| **Hierarchical Fragmentation** | Large Asteroids (4.0r) → 2 Medium (2.0r) → 2 Small (1.0r) → Destroyed |
| **Particle System** | Radial velocity bursts on asteroid/ship destruction |

## Files

| File | Description |
|---|---|
| `AsteroidsEvents.js` | Event, AsteroidsState, AsteroidSize constants |
| `AsteroidsComponents.js` | Collider, Lifetime, Rotation, Particle, Input, Status, Audio components |
| `AsteroidsActors.js` | Actor factories for Ship, Asteroid, Bullet, Particle, HUD |
| `AsteroidsPool.js` | Reusable Object Pool (`EntityPool`) for bullets and particles |
| `AsteroidsSystems.js` | ShipInput, ContinuousPhysics, WorldWrapping, Lifetime, Collision, Particle systems |
| `AsteroidsWorld.js` | World orchestration, wave management, asteroid splitting, pooling |
| `AsteroidsApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/asteroids/main.js').then(m => { const r = m.runAsteroidsApp(); console.log(r); })"
```
