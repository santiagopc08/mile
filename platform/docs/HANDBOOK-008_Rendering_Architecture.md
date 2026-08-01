# HANDBOOK-008 — Rendering Architecture

## Purpose

Define the Rendering subsystem architecture.

---

## Responsibilities

Renderer SHALL own:

* Render Queue
* Render Graph
* GPU Resources
* Command Submission
* Frame Synchronization

Renderer SHALL NOT own:

* Gameplay
* Physics
* Scene Logic

---

## Rendering Flow

```text
Scene

↓

Visibility

↓

Render Queue

↓

Render Graph

↓

Command Buffer

↓

GPU

↓

Present
```

---

## Frame Data

Rendering SHALL consume immutable frame snapshots.

Simulation data SHALL NOT be modified.

---

## Render Queue

Queue SHALL support:

* Layer
* Material
* Z Order
* Transparency

Sorting SHALL be deterministic.

---

## GPU Resources

Resources SHALL include:

```text
Textures

Buffers

Shaders

Pipelines

Framebuffers
```

Lifetime SHALL be managed internally.

---

## Render Graph

Render passes SHALL declare:

* Inputs
* Outputs
* Dependencies

Execution SHALL be dependency-driven.

---

## Backends

Rendering backend SHALL be abstract.

Initial backend:

```text
SDL3 GPU
```

Future:

```text
Metal

Vulkan

DirectX 12
```

---

## Acceptance Criteria

* Immutable frame rendering.
* Deterministic render order.
* Backend abstraction.
* Internal GPU lifetime management.
