# HANDBOOK-009 — Asset Framework

## Purpose

Define asset identity, lifetime and runtime usage.

---

## Asset Identity

Every asset SHALL have:

```text
UUID

Type

Version

Hash

Metadata
```

Identity SHALL survive renaming.

---

## Asset Handles

Subsystems SHALL use:

```text
AssetHandle<T>
```

Raw asset pointers are forbidden.

---

## Asset Lifecycle

```text
Discovered

↓

Imported

↓

Registered

↓

Loaded

↓

Cached

↓

Referenced

↓

Released

↓

Unloaded
```

---

## Registry

Registry SHALL expose metadata only.

Registry SHALL NOT load assets.

---

## Database

Database SHALL persist:

* UUID
* Metadata
* Dependencies
* Import state

---

## Cache

Cache SHALL ensure:

* Single runtime instance.
* Reference counting.
* Deterministic eviction.

---

## Dependencies

Assets SHALL declare dependencies explicitly.

Circular dependencies are forbidden.

---

## Hot Reload

Reload SHALL preserve valid Asset Handles.

Consumers SHALL receive change notifications.

---

## Acceptance Criteria

* Stable UUIDs.
* Handle-based access.
* Persistent registry.
* Safe Hot Reload.
