# HANDBOOK-011 — Scene System

## Purpose

Define scene management, lifecycle and world organization.

---

## Responsibilities

Scene SHALL own:

* Entity Registry
* Scene Graph
* World State
* Scene Metadata

Scene SHALL NOT own:

* Rendering
* Physics
* Assets
* Audio

---

## Scene Lifecycle

```text
Created

↓

Loading

↓

Loaded

↓

Active

↓

Paused

↓

Unloading

↓

Destroyed
```

---

## Scene Structure

```text
Scene

├── Metadata

├── Entity Registry

├── Scene Graph

├── Systems

└── Runtime State
```

---

## Scene Operations

Support:

```text
Create

Load

Save

Unload

Reload

Duplicate
```

---

## Scene Switching

```text
Current Scene

↓

Freeze

↓

Unload

↓

Load Next

↓

Initialize

↓

Activate
```

Transition SHALL be atomic.

---

## Scene Graph

The Scene Graph SHALL manage:

* Parent
* Children
* Hierarchical Transform

The Scene Graph SHALL NOT own entity lifetime.

---

## Scene Serialization

Scene SHALL serialize:

* Entities
* Components
* Metadata
* References

Transient runtime state SHALL NOT be serialized.

---

## Acceptance Criteria

* Atomic transitions.
* Independent scene lifetime.
* Deterministic serialization.
* Hierarchical transforms.
