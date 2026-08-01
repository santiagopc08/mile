# HANDBOOK-002 — Module System

## Purpose

Define the architecture, lifecycle and contracts of every Engine module.

---

## Module Definition

A module is the smallest deployable Engine subsystem.

A module SHALL:

* Expose a public API.
* Own its internal state.
* Declare dependencies.
* Support independent initialization.
* Support independent shutdown.

---

## Module Layout

```text
module/

    include/

    src/

    tests/

    docs/

    CMakeLists.txt
```

---

## Public Interface

Every module SHALL expose:

```cpp
initialize()

shutdown()

update()

configure()

version()
```

Optional:

```cpp
fixedUpdate()

lateUpdate()

render()

diagnostics()
```

---

## Module Descriptor

Every module SHALL define:

```text
Module Name

Module ID

Version

Dependencies

Capabilities

Initialization Priority
```

---

## Lifecycle

```text
Created

↓

Configured

↓

Initialized

↓

Running

↓

Stopping

↓

Stopped

↓

Destroyed
```

Illegal transitions are forbidden.

---

## Dependency Rules

Modules SHALL declare dependencies explicitly.

Initialization SHALL follow dependency order.

Circular dependencies are forbidden.

---

## Registration

Modules SHALL register through the Module Registry.

Manual dependency wiring is forbidden.

---

## Configuration

Configuration SHALL be immutable during startup.

Runtime configuration SHALL occur through dedicated APIs.

---

## Diagnostics

Every module SHALL expose:

```text
Initialization State

Version

Memory Usage

Execution Time

Health Status
```

---

## Failure Handling

Initialization failure SHALL rollback dependent modules.

Partial module activation is forbidden.

---

## Thread Safety

Module initialization SHALL execute on the main thread.

Runtime execution SHALL declare thread affinity explicitly.

---

## Acceptance Criteria

* Independent compilation.
* Independent lifecycle.
* Explicit dependencies.
* Atomic startup/shutdown.
* No cyclic dependencies.
