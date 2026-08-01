# HANDBOOK-001 — Engine Architecture

## Purpose

Define the immutable high-level architecture of the Platform.

This document specifies subsystem boundaries, dependency rules, initialization order and lifecycle.

---

## Architecture

```text
Applications
│
├── Games
├── Editor
└── Tools
        │
        ▼
Engine Modules
│
├── Gameplay
├── UI
├── Physics
├── Audio
├── Rendering
├── Assets
├── Scene
├── ECS
├── Input
└── Runtime
        │
        ▼
Platform Layer
│
├── Window
├── Filesystem
├── Timer
├── Input
├── Display
└── Audio Device
        │
        ▼
Operating System
```

---

## Dependency Rules

Allowed:

```text
Application
↓

Engine

↓

Runtime

↓

Platform
```

Forbidden:

```text
Platform → Engine

Runtime → Gameplay

Rendering → Physics

Physics → Audio

Assets → Rendering
```

Subsystem interaction SHALL occur through public interfaces or Runtime events.

---

## Engine Modules

Every module SHALL contain:

```text
include/
src/
tests/
docs/
CMakeLists.txt
```

Public headers SHALL reside exclusively in `include/`.

Private implementation SHALL reside exclusively in `src/`.

---

## Module Contract

Each module SHALL expose:

* Public API
* Initialization
* Shutdown
* Configuration
* Runtime Events
* Diagnostics

Internal state SHALL remain private.

---

## Initialization Order

```text
Platform
↓

Logging
↓

Configuration
↓

File System

↓

Assets

↓

Window

↓

Renderer

↓

Input

↓

Audio

↓

Physics

↓

Scene

↓

Gameplay

↓

UI

↓

Application
```

Initialization SHALL fail atomically. If any module fails, previously initialized modules SHALL shut down in reverse order.

---

## Shutdown Order

```text
Application
↓

UI

↓

Gameplay

↓

Scene

↓

Physics

↓

Audio

↓

Renderer

↓

Assets

↓

Platform
```

Shutdown SHALL release all owned resources before returning control to the operating system.

---

## Runtime Lifecycle

```text
Initialize

↓

Load Configuration

↓

Initialize Modules

↓

Load Assets

↓

Create Scene

↓

Run Main Loop

↓

Shutdown Scene

↓

Shutdown Modules

↓

Exit
```

---

## Main Loop Contract

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

Prepare Rendering

↓

Render

↓

Present

↓

Diagnostics
```

The order SHALL remain stable across all applications.

---

## Configuration

Every module SHALL expose a configuration object.

Configuration SHALL be immutable during initialization.

Runtime changes SHALL occur only through explicit APIs.

---

## Diagnostics

Every module SHALL provide:

* Initialization status
* Version
* Performance metrics
* Memory usage
* Error state

Diagnostics SHALL be queryable without modifying module state.

---

## Failure Handling

Module initialization SHALL return explicit success or failure.

Partial initialization SHALL trigger rollback.

Undefined module states are forbidden.

---

## Testing Requirements

Each module SHALL provide:

* Unit tests
* Integration tests
* Initialization tests
* Shutdown tests
* Failure tests

---

## Acceptance Criteria

The Engine Architecture SHALL guarantee:

* Layer isolation.
* Deterministic initialization and shutdown.
* Stable dependency direction.
* Public API boundaries.
* Independent module compilation.
* Explicit lifecycle management.
* Atomic startup and shutdown.
* Complete diagnostic visibility.
