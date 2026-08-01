# HANDBOOK-021 — Save System

## Purpose

Define runtime persistence.

---

## Save Types

Support:

```text
Manual

Autosave

Checkpoint

Quick Save
```

---

## Saved Data

Persist:

* World State
* Gameplay State
* Player State
* Statistics
* Settings

Do NOT persist:

* Runtime caches
* Temporary allocations
* Diagnostics

---

## Save Flow

```text
Runtime

↓

Serialize

↓

Write

↓

Validate
```

---

## Load Flow

```text
Read

↓

Validate

↓

Deserialize

↓

Restore Runtime
```

---

## Acceptance Criteria

* Deterministic saves.
* Version migration.
* Atomic save/load.
