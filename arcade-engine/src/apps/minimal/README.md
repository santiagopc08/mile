# TS-001 / RG-001 — Minimal Reference Application

This is the canonical minimal reference implementation of the **ORBIT Arcade Platform 1.0**.

## Overview
- **Goal**: Demonstrate end-to-end execution flow of an application using exclusively public SDK APIs.
- **Components Used**:
  - `Application` & `ApplicationManifest` (IMP-017)
  - `Runtime` & `ExecutionPipeline` (IMP-014)
  - `Actor` & `ActorRegistry` (IMP-008)
  - `TransformComponent` & `MovementComponent` (IMP-009)
  - `PresentationComponent` & `SpriteComponent` (IMP-010)
  - `ViewportManager` & `Camera` (IMP-015)
  - `RenderingSystem` & `HeadlessRendererAdapter` (IMP-016)

## Execution Flow
1. `Application.initialize()` creates `MinimalWorld` and spawns `PlayerActor`.
2. Registers `MinimalWorldSystem` into `Runtime` pipeline.
3. On every `tick(dt)`:
   - Evaluates keyboard direction input.
   - Updates movement velocities and position transform.
   - Generates render commands and submits them to the `HeadlessRendererAdapter`.
