# Global Rule — Gameplay State Machine

## Purpose

The Engine SHALL provide a generic Gameplay State Machine reusable by all games.

---

## Responsibilities

The Gameplay State Machine SHALL:

* Manage gameplay lifecycle.
* Control state transitions.
* Dispatch state events.
* Synchronize gameplay systems.

---

## Default States

Support:

```text
Boot

Loading

Ready

Playing

Paused

Completed

Failed

Exiting
```

Games MAY extend this list.

---

## State Rules

* Only one Gameplay State SHALL be active at any time.
* State transitions SHALL be atomic.
* Invalid transitions SHALL be rejected.
* State changes SHALL generate Runtime Events.

---

## Acceptance Criteria

Every game SHALL integrate with the Gameplay State Machine.
