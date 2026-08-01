# RA-001 — Interactive Simulation Reference Application

## Purpose

RA-001 is the official reference application proving that **ORBIT Arcade Platform** is a general-purpose,
platform-independent interactive application platform capable of powering non-game tools, editors, and interactive visualizers.

It reuses the exact same underlying core SDK capabilities (`Platform`, `Runtime`, `Actor SDK`, `Viewport`, `Rendering`, `Persistence`, `Diagnostics`) as the game reference applications.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Platform** (IMP-017) | `Application`, `ApplicationManifest`, Service Injection |
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` scene graph management |
| **Movement** (IMP-009) | `TransformComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for simulation events |
| **Persistence** (IMP-018) | `Serializer` & `MemoryStorageProvider` scene saving & loading |
| **Diagnostics** (IMP-019) | Runtime telemetry tracking |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` tick loop |

## Key Non-Game Target Capabilities

| Feature | Implementation |
|---|---|
| **Pick Selection** | `SelectionSystem` with single & multi-select toggle |
| **Scene Graph** | `HierarchySystem` for parent-child transform propagation |
| **Undo / Redo** | Command pattern stack (`UndoRedoStack`, `TransactionCommand`) |
| **Live Property Inspector** | `InspectorSystem` for live parameter inspection & modification |
| **Scene Persistence** | Full scene JSON serialization, save, and restore |

## Files

| File | Description |
|---|---|
| `SimulationEvents.js` | Event & SimulationState constants |
| `UndoRedoStack.js` | Command pattern stack for undo/redo scene transactions |
| `SimulationComponents.js` | Hierarchy, Selection, Inspector, Persistence, UIWidget, Audio components |
| `SimulationActors.js` | Actor factories for Camera, Entity, Light, Widget, DebugTool, HUD |
| `SimulationSystems.js` | SelectionSystem, HierarchySystem, InspectorSystem |
| `SimulationWorld.js` | World orchestration, scene graph, undo/redo, persistence, audio |
| `SimulationApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/simulation/main.js').then(m => { const r = m.runSimulationApp(); console.log(r); })"
```
