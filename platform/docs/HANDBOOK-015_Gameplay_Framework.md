# HANDBOOK-015 — Gameplay Framework

## Purpose

Define gameplay architecture.

---

## Responsibilities

Gameplay SHALL own:

* Rules
* Objectives
* Progression
* Match State

Gameplay SHALL NOT own:

* Physics
* Rendering
* Assets
* Platform

---

## Gameplay Flow

```text
Input

↓

Gameplay

↓

Runtime Events

↓

Subsystems
```

---

## Gameplay State

Support:

```text
Loading

Ready

Playing

Paused

Completed
```

---

## Communication

Gameplay SHALL communicate exclusively through:

* Runtime APIs
* Runtime Events

Direct subsystem calls are forbidden.

---

## Persistence

Gameplay SHALL expose serializable state.

---

## Validation

Gameplay SHALL be executable headless.

---

## Acceptance Criteria

* Runtime-independent rules.
* Serializable state.
* Event-driven communication.
