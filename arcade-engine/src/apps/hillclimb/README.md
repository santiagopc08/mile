# RG-008 — Hill Climb Reference Application

## Purpose

RG-008 is the official reference application for the **Physics Framework**, **Constraint Framework**,
**Procedural Heightmap Terrain**, **Composite Vehicles**, and **Dynamic 2D Camera Follow** on the ORBIT Arcade Platform.

It validates continuous physics simulation, spring-damper suspension constraints, terrain height evaluation, and out-of-fuel / flip state mechanics.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` |
| **Movement** (IMP-009) | `TransformComponent`, `RigidBodyComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for game events |
| **Persistence** (IMP-018) | Distance storage & `ReplayRecorder` |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` continuous tick loop |
| **Platform** (IMP-017) | `Application`, `ApplicationManifest` |

## Key Technical Targets

| Feature | Implementation |
|---|---|
| **Composite Vehicle** | Chassis + Front Wheel + Rear Wheel tied with `WheelJointComponent` |
| **Suspension Constraints** | Hooke's Law Spring Force `F = -k * dx` + Damping `c * dv` |
| **Procedural Terrain** | Multi-octave sine composition `y = f(x)` with slope `dy/dx` |
| **Dynamic Camera** | Smooth 2D follow tracking vehicle position |
| **Collectibles & Fuel** | Distance coins + Fuel cans restoring `FuelTankComponent` |

## Files

| File | Description |
|---|---|
| `HillClimbEvents.js` | Event & HillClimbState constants |
| `HillClimbTerrain.js` | ProceduralTerrain heightmap generator & normal calculation |
| `HillClimbComponents.js` | RigidBody, WheelJoint, Engine, FuelTank, CameraFollow, Input, Status, Audio |
| `HillClimbActors.js` | Actor factories for Composite Vehicle, Coins, Fuel Cans, HUD |
| `HillClimbSystems.js` | VehicleInput, PhysicsEngine, CameraFollow, Collectibles systems |
| `HillClimbWorld.js` | World orchestration, infinite terrain expansion, fuel depletion, flip checks |
| `HillClimbApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/hillclimb/main.js').then(m => { const r = m.runHillClimbApp(); console.log(r); })"
```
