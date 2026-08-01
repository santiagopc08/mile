# RG-009 — Sandbox Reference Application

## Purpose

RG-009 is the official reference application for **Capability Composition**, **Runtime Orchestration**,
**Domain Hot Reloading**, **Plugin Integration**, and **Runtime Diagnostics** on the ORBIT Arcade Platform.

It proves that ORBIT Arcade Platform is a fully composable capability platform capable of orchestrating independent domains dynamically.

## Validated SDK Modules

| Module | Usage |
|---|---|
| **Platform** (IMP-017) | `Application`, `ApplicationManifest`, `PluginLoader`, service injection |
| **Diagnostics** (IMP-019) | `DiagnosticsManager`, `RuntimeInspector`, telemetry tracking |
| **Actor SDK** (IMP-008) | `Actor`, `ActorTag`, `ActorRegistry` dynamic mutation |
| **Movement** (IMP-009) | `TransformComponent` |
| **Presentation** (IMP-010) | `PresentationComponent`, `SpriteComponent` |
| **Events** (IMP-002) | `EventBus` for 10 platform capability events |
| **Viewport** (IMP-015) | `ViewportManager` |
| **Rendering** (IMP-016) | `RenderingSystem`, `HeadlessRendererAdapter` |
| **Runtime** (IMP-014) | `Runtime` execution pipeline |

## Key Technical Targets

| Feature | Implementation |
|---|---|
| **Capability Composition** | `CapabilityRegistry` managing 9 SDK domains (`PHYSICS`, `NAVIGATION`, `COGNITION`, etc.) |
| **Runtime Orchestrator** | `RuntimeOrchestrator` handling domain dispatch, step control, and telemetry |
| **Hot Reload** | Live system re-binding for domains without runtime re-initialization |
| **Plugin Integration** | Dynamic loading and unloading of platform plugins |
| **Scene & Actor Mutation** | Live creation/destruction of actors and addition/removal of components |

## Files

| File | Description |
|---|---|
| `SandboxEvents.js` | Event, SandboxState, DomainCapability constants |
| `CapabilityRegistry.js` | Domain capability descriptor & registry manager |
| `RuntimeOrchestrator.js` | Domain orchestrator, plugin lifecycle, hot reload manager |
| `SandboxComponents.js` | Capability, CustomScript, DebugInspector, AudioSource, Light, Status components |
| `SandboxActors.js` | Actor factories for Camera, Player, Vehicle, NPC, Light, Props, DebugActor, HUD |
| `SandboxWorld.js` | World orchestration, capability toggles, plugin loading, component mutations |
| `SandboxApp.js` | Application shell |
| `main.js` | Simulation runner |

## Running

```bash
node -e "import('./src/apps/sandbox/main.js').then(m => { const r = m.runSandboxApp(); console.log(r); })"
```
