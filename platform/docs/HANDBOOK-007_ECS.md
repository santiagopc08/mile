# HANDBOOK-007 — Entity Component System

## Purpose

Define the ECS architecture.

---

## Entity

Entity SHALL be:

* Identifier only.
* Trivially copyable.
* Immutable.

Entity SHALL NOT contain behavior.

---

## Components

Components SHALL:

* Contain data only.
* Be trivially movable.
* Avoid ownership.

Components SHALL NOT:

* Execute logic.
* Reference other components directly.

---

## Systems

Systems SHALL:

* Read component data.
* Write component data.
* Execute behavior.

Systems SHALL NOT own entities.

---

## Registry

Registry SHALL own:

* Entity creation.
* Entity destruction.
* Component storage.
* Queries.

---

## Views

Support:

```text
View

ConstView

FilteredView
```

Views SHALL NOT allocate memory.

---

## Component Storage

Storage SHALL be contiguous.

Sparse lookup SHALL be O(1).

---

## Entity Lifecycle

```text
Create

↓

Add Components

↓

Active

↓

Destroy

↓

Recycle
```

---

## Component Rules

Components SHALL be added and removed explicitly.

Hidden component creation is forbidden.

---

## System Execution

Systems SHALL declare:

* Read dependencies.
* Write dependencies.

Execution order SHALL be deterministic.

---

## Acceptance Criteria

* Contiguous storage.
* O(1) entity lookup.
* Deterministic execution.
* Data-only components.
