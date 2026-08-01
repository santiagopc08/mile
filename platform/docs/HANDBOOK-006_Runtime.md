# HANDBOOK-006 — Runtime

## Purpose

Define the Runtime lifecycle, execution model and responsibilities.

The Runtime SHALL be the only execution environment for Applications, Editor and Games.

---

## Responsibilities

The Runtime SHALL own:

* Main Loop
* Time
* Module Lifecycle
* Event Dispatch
* Scene Execution
* Update Scheduling
* Diagnostics

The Runtime SHALL NOT own:

* Gameplay Logic
* Editor UI
* Project Data
* Asset Importing

---

## Runtime Lifecycle

```text
Boot

↓

Initialize Platform

↓

Initialize Modules

↓

Load Project

↓

Create World

↓

Run

↓

Shutdown World

↓

Shutdown Modules

↓

Exit
```

---

## Update Order

```text
Poll Platform

↓

Process Events

↓

Update Time

↓

Update Input

↓

Fixed Update

↓

Variable Update

↓

Late Update

↓

Render

↓

Present

↓

Diagnostics
```

The order SHALL remain immutable.

---

## Update Interfaces

Supported update phases:

```cpp
fixedUpdate()

update()

lateUpdate()

render()
```

Modules SHALL implement only the phases they require.

---

## Fixed Update

Fixed timestep SHALL be deterministic.

Simulation SHALL execute only during Fixed Update.

---

## Variable Update

Variable Update SHALL execute gameplay that is not simulation-dependent.

---

## Late Update

Late Update SHALL resolve dependencies after Update.

Examples:

* Camera
* UI synchronization
* Cleanup

---

## Render Phase

Rendering SHALL consume immutable frame data.

Simulation during rendering is forbidden.

---

## Runtime State

```text
Created

↓

Initialized

↓

Running

↓

Paused

↓

Stopping

↓

Stopped
```

---

## Pause Rules

Pause SHALL suspend simulation.

Pause SHALL NOT suspend:

* UI
* Diagnostics
* Editor
* Asset Loading

---

## Acceptance Criteria

* Deterministic execution.
* Stable lifecycle.
* Immutable update order.
* Fixed timestep simulation.
