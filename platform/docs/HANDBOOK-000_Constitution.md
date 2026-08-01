# HANDBOOK-000 — Constitution

## Purpose

Define the immutable architectural principles governing the Platform.

This document is normative.

---

## Scope

This constitution applies to:

* Runtime
* Editor
* Tooling
* Games
* Plugins
* Tests
* Build Pipeline

Every subsystem SHALL comply.

---

# Core Principles

## P1 — Runtime First

The Runtime is the only execution environment.

Editor, tools and games SHALL consume Runtime APIs.

No Runtime behavior SHALL exist exclusively inside the Editor.

---

## P2 — Modular Architecture

Every subsystem SHALL exist as an isolated module.

Modules SHALL communicate only through public interfaces.

Direct implementation dependencies are forbidden.

---

## P3 — Dependency Direction

Dependencies SHALL always point toward lower abstraction layers.

Allowed:

```text
Game
↓

Gameplay

↓

Runtime

↓

Platform
```

Forbidden:

```text
Runtime
↓

Gameplay
```

---

## P4 — Single Responsibility

Every module SHALL have exactly one responsibility.

Modules SHALL NOT combine unrelated functionality.

---

## P5 — Event Driven

Communication between independent modules SHALL occur through Runtime Events.

Subsystems SHALL NOT invoke unrelated systems directly.

---

## P6 — Data-Oriented Runtime

Runtime simulation SHALL be data-oriented.

Behavior SHALL operate over data.

Objects SHALL NOT own gameplay logic.

---

## P7 — Determinism

Runtime execution SHALL produce identical results for identical inputs.

Simulation SHALL NOT depend on frame rate.

---

## P8 — Platform Independence

Platform APIs SHALL remain isolated.

Runtime SHALL NOT access:

* SDL
* Win32
* Cocoa
* X11
* Linux APIs

outside Platform Layer.

---

## P9 — Asset Driven

Runtime SHALL consume Assets.

Runtime SHALL NOT consume files.

---

## P10 — Editor Independence

The Editor is a Runtime client.

Editor SHALL NOT contain duplicated engine implementations.

---

## P11 — Composition

Composition SHALL replace inheritance whenever possible.

Runtime entities SHALL be assembled from components.

---

## P12 — Explicit Ownership

Every resource SHALL have one owner.

Shared ownership SHALL be explicit.

Implicit ownership is forbidden.

---

## P13 — Public APIs Only

Subsystems SHALL expose functionality exclusively through documented public interfaces.

Internal implementations SHALL remain inaccessible.

---

## P14 — Immutable Contracts

Public interfaces SHALL remain stable.

Breaking changes SHALL require version updates.

---

## P15 — No Hidden State

Subsystem state SHALL be explicit.

Global mutable state is forbidden.

---

## P16 — Testability

Every subsystem SHALL be independently testable.

Hidden dependencies are forbidden.

---

## P17 — Hot Reload Safe

Hot Reload SHALL preserve Runtime stability.

Runtime references SHALL remain valid whenever possible.

---

## P18 — Cross Platform

Every feature SHALL function on:

* Windows
* Linux
* macOS

Platform-specific implementations SHALL remain isolated.

---

## P19 — Performance First

Performance SHALL be considered during architecture.

Optimization SHALL NOT compromise maintainability.

---

## P20 — Simplicity

The simplest architecture satisfying requirements SHALL be preferred.

Premature abstraction is forbidden.

---

# Architectural Layers

```text
Games
│
Gameplay
│
Editor
│
Engine Modules
│
Runtime
│
Platform
│
Operating System
```

No layer SHALL bypass another.

---

# Module Rules

Every module SHALL define:

* Public API
* Private Implementation
* Dependencies
* Lifecycle
* Events
* Tests

Every module SHALL compile independently.

---

# Runtime Rules

Runtime SHALL own:

* Update Loop
* ECS
* Physics
* Rendering
* Audio
* Assets
* Input
* Events
* Time

Runtime SHALL NOT own:

* Editor UI
* Project Files
* Tool Windows

---

# Threading Rules

Runtime SHALL remain correct under:

* Single-thread execution
* Future multi-thread execution

Thread affinity SHALL be explicit.

---

# Memory Rules

Ownership SHALL be deterministic.

Memory leaks SHALL be treated as defects.

Raw owning pointers are forbidden.

---

# Error Handling

Recoverable failures SHALL return explicit error values.

Fatal failures SHALL terminate deterministically.

Exceptions SHALL NOT be used for Runtime control flow.

---

# Logging

Every subsystem SHALL expose structured logging.

Logging SHALL remain configurable.

Logging SHALL NOT affect Runtime behavior.

---

# Naming Rules

Namespaces:

```text
orbit::<module>
```

Types:

```text
PascalCase
```

Functions:

```text
camelCase
```

Members:

```text
m_member
```

Constants:

```text
kConstant
```

Enums:

```text
PascalCase
```

---

# Documentation Rules

Every public API SHALL document:

* Purpose
* Parameters
* Return values
* Lifetime
* Thread safety

---

# Code Rules

Forbidden:

* Circular dependencies
* God objects
* Hidden globals
* Magic numbers
* Hardcoded paths
* Hardcoded assets
* Static mutable state

Required:

* RAII
* Const correctness
* Move semantics
* Explicit ownership

---

# Versioning

Platform SHALL follow Semantic Versioning.

Public APIs SHALL be versioned.

Assets SHALL be versioned.

Serialization SHALL be versioned.

---

# Acceptance Criteria

The Platform SHALL satisfy:

* Modular architecture.
* Stable public APIs.
* Deterministic Runtime.
* Cross-platform execution.
* Independent Editor.
* Asset-driven resource management.
* Event-driven communication.
* Explicit ownership.
* Testable subsystems.
* Zero cyclic dependencies.
