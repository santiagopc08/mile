# HANDBOOK v1.0 — Master Specification Index

> [!IMPORTANT]
> **HANDBOOK v1.0 PRODUCTION ARCHITECTURE FROZEN**
> The Platform Architecture is complete and normative across all 26 specification documents (`000` through `025`), [GAME-001 Definition of Done](file:///Users/santi/Documents/mile/platform/docs/GAME-001_Definition_of_Done.md), [Engine Contribution Policy](file:///Users/santi/Documents/mile/platform/docs/ENGINE_CONTRIBUTION_POLICY.md), [Configuration / Runtime State Separation Policy](file:///Users/santi/Documents/mile/platform/docs/CONFIG_RUNTIME_SEPARATION_POLICY.md), [Autonomous Validation Policy](file:///Users/santi/Documents/mile/platform/docs/AUTONOMOUS_VALIDATION_POLICY.md), [Gameplay State Machine Policy](file:///Users/santi/Documents/mile/platform/docs/GAMEPLAY_STATE_MACHINE_POLICY.md), [Camera / Renderer Separation Policy](file:///Users/santi/Documents/mile/platform/docs/CAMERA_RENDERER_SEPARATION_POLICY.md), [Runtime Profiler Interface Policy](file:///Users/santi/Documents/mile/platform/docs/RUNTIME_PROFILER_POLICY.md), and [Framework Before Feature Policy](file:///Users/santi/Documents/mile/platform/docs/FRAMEWORK_BEFORE_FEATURE_POLICY.md).
> All future engineering work SHALL focus exclusively on implementation, code review, testing, optimization, and game development on top of this frozen foundation.

---

## Complete Handbook Specification Suite

| Document | Title | Description |
| :--- | :--- | :--- |
| **[GAME-001](file:///Users/santi/Documents/mile/platform/docs/GAME-001_Definition_of_Done.md)** | **Definition of Done** | Global DoD Criteria (Build, Validation, Testing, Memory, Performance, Cross-Platform, Docs, Architecture, Reusability). |
| **[POLICY-001](file:///Users/santi/Documents/mile/platform/docs/ENGINE_CONTRIBUTION_POLICY.md)** | **Engine Contribution Policy** | Mandated Engine Contribution Rules (Infrastructure vs. Game Content, Reusability Strategy). |
| **[POLICY-002](file:///Users/santi/Documents/mile/platform/docs/CONFIG_RUNTIME_SEPARATION_POLICY.md)** | **Config / Runtime Separation** | Mandatory Separation of Serialized Config vs. Transient Runtime State. |
| **[POLICY-003](file:///Users/santi/Documents/mile/platform/docs/AUTONOMOUS_VALIDATION_POLICY.md)** | **Autonomous Validation** | Mandatory Autonomous Validation Controllers & Zero Human Input Scenarios. |
| **[POLICY-004](file:///Users/santi/Documents/mile/platform/docs/GAMEPLAY_STATE_MACHINE_POLICY.md)** | **Gameplay State Machine** | Mandatory Generic Gameplay State Machine & Runtime Event Dispatch. |
| **[POLICY-005](file:///Users/santi/Documents/mile/platform/docs/CAMERA_RENDERER_SEPARATION_POLICY.md)** | **Camera / Renderer Separation** | Mandatory Separation of CameraView Output vs. Renderer Input. |
| **[POLICY-006](file:///Users/santi/Documents/mile/platform/docs/RUNTIME_PROFILER_POLICY.md)** | **Runtime Profiler Interface** | Mandatory Read-only Subsystem Profiler Interface & Performance Metrics. |
| **[POLICY-007](file:///Users/santi/Documents/mile/platform/docs/FRAMEWORK_BEFORE_FEATURE_POLICY.md)** | **Framework Before Feature** | Mandatory Pre-existence of Generic Engine Frameworks before Game Feature Consumption. |
| **[POLICY-008](file:///Users/santi/Documents/mile/platform/docs/DETERMINISTIC_GAMEPLAY_POLICY.md)** | **Deterministic Gameplay** | Mandatory Deterministic Fixed Timestep Simulation & Simulation / Presentation Separation. |
| **[HANDBOOK-000](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-000_Constitution.md)** | **Constitution** | Immutable Architectural Principles (P1–P20), Layer Boundaries & Naming Rules. |
| **[HANDBOOK-001](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-001_Engine_Architecture.md)** | **Engine Architecture** | Subsystem Boundaries, Initialization/Shutdown Order & Main Loop Contract. |
| **[HANDBOOK-002](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-002_Module_System.md)** | **Module System** | Module Layout, Lifecycle State Machine, Descriptors & Registry. |
| **[HANDBOOK-003](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-003_Memory_Model.md)** | **Memory Model** | Explicit Ownership, Allocators (`Arena`, `Pool`), RAII & Zero Leak Policy. |
| **[HANDBOOK-004](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-004_Threading_Model.md)** | **Threading Model** | Main/Worker/IO Thread Types, Job System & Frame Synchronization. |
| **[HANDBOOK-005](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-005_Event_System.md)** | **Event System** | Event Structure, Bus Subscriptions, Immediate/Deferred Dispatch & Diagnostics. |
| **[HANDBOOK-006](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-006_Runtime.md)** | **Runtime** | Runtime Lifecycle, Update Phases & Simulation Suspension Pause Rules. |
| **[HANDBOOK-007](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-007_ECS.md)** | **Entity Component System** | Data-only Components, Zero-allocation Views & O(1) Contiguous Storage. |
| **[HANDBOOK-008](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-008_Rendering_Architecture.md)** | **Rendering Architecture** | Immutable Frame Snapshots, Sorted Render Queue & SDL3 GPU Abstraction. |
| **[HANDBOOK-009](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-009_Asset_Framework.md)** | **Asset Framework** | UUID Identity, `AssetHandle<T>` Access, Reference Counting & Hot Reload. |
| **[HANDBOOK-010](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-010_Physics_Architecture.md)** | **Physics Architecture** | Box2D Backend, Fixed Timestep Constraints & Spatial Queries. |
| **[HANDBOOK-011](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-011_Scene_System.md)** | **Scene System** | Scene Lifecycle, Atomic Switching & Hierarchical Transform Graph. |
| **[HANDBOOK-012](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-012_Input_System.md)** | **Input System** | Device Abstraction, Action State Mapping & Immutable Frame Snapshots. |
| **[HANDBOOK-013](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-013_Audio_Architecture.md)** | **Audio Architecture** | Event-driven Playback, Hierarchical Buses (`Master`, `Music`, `SFX`, `UI`, `Ambient`). |
| **[HANDBOOK-014](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-014_UI_Framework.md)** | **UI Framework** | Widget Tree (`Canvas` → `Container` → `Widgets`), Layout Managers & Themes. |
| **[HANDBOOK-015](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-015_Gameplay_Framework.md)** | **Gameplay Framework** | Match States (`Loading`, `Ready`, `Playing`, `Paused`, `Completed`) & Headless Rules. |
| **[HANDBOOK-016](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-016_Editor_Architecture.md)** | **Editor Architecture** | Editor Client Architecture, 7 Panel Windows, Commands & Workspace Layout. |
| **[HANDBOOK-017](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-017_Build_Release.md)** | **Build & Release** | Build Profiles, Release Pipeline, Semantic Versioning & Artifact Validation. |
| **[HANDBOOK-018](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-018_Coding_Standards.md)** | **Coding Standards** | C++23 Standard, Naming (`orbit::<module>`), RAII & `std::expected`/`std::optional`. |
| **[HANDBOOK-019](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-019_API_Design.md)** | **API Design Guidelines** | Minimal, Deterministic APIs, Parameter Rules & Thread Safety Declarations. |
| **[HANDBOOK-020](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-020_Serialization.md)** | **Serialization** | JSON/Binary Formats, Object Versioning & UUID Reference Persistence. |
| **[HANDBOOK-021](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-021_Save_System.md)** | **Save System** | Persistence Pipeline (Manual, Autosave, Checkpoint, Quick Save). |
| **[HANDBOOK-022](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-022_Plugin_System.md)** | **Plugin System** | Dynamic Loading Lifecycle & Engine Extensibility. |
| **[HANDBOOK-023](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-023_Testing_Strategy.md)** | **Testing Strategy** | Test Types, Headless Execution & Automated CI Pipeline Rules. |
| **[HANDBOOK-024](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-024_Performance_Guidelines.md)** | **Performance Guidelines** | Performance Budgets (60 FPS, 16.6 ms frame budget, Startup < 500 ms). |
| **[HANDBOOK-025](file:///Users/santi/Documents/mile/platform/docs/HANDBOOK-025_Documentation_Standards.md)** | **Documentation Standards** | API, Module, and Game Documentation Rules. |

---

## HANDBOOK v1.0 Exit Criteria Verification

- [x] Every subsystem has a single authoritative specification.
- [x] No architectural decisions remain undefined.
- [x] All implementation contracts are explicit.
- [x] Public interfaces and lifecycle rules are fully specified.
- [x] Global Definition of Done (GAME-001) established.
- [x] Engine Contribution Policy established.
- [x] Config / Runtime State Separation Policy established.
- [x] Autonomous Validation Policy established.
- [x] Gameplay State Machine Policy established.
- [x] Camera / Renderer Separation Policy established.
- [x] Runtime Profiler Interface Policy established.
- [x] Framework Before Feature Policy established.
- [x] Platform Architecture is 100% Frozen for Production.
