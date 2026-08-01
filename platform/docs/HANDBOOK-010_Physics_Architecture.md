# HANDBOOK-010 — Physics Architecture

## Purpose

Define the Physics subsystem.

---

## Responsibilities

Physics SHALL own:

* Simulation
* Collision Detection
* Constraints
* Queries

Physics SHALL NOT own:

* Gameplay
* Rendering
* Audio

---

## Backend

Initial backend:

```text
Box2D
```

Backend SHALL remain replaceable.

---

## Physics World

World SHALL own:

* Bodies
* Shapes
* Constraints
* Contacts

---

## Body Types

Support:

```text
Static

Dynamic

Kinematic
```

---

## Simulation

Physics SHALL execute only during Fixed Update.

Variable timestep simulation is forbidden.

---

## Queries

Support:

```text
Raycast

Overlap

ShapeCast

Point Query
```

---

## Collision Events

Support:

```text
Collision Begin

Collision End

Trigger Enter

Trigger Exit
```

Events SHALL be immutable.

---

## Synchronization

```text
Transform

↓

Physics

↓

Transform
```

Synchronization SHALL occur once per Fixed Update.

---

## Debug

Expose:

* Bodies
* Shapes
* Contacts
* Constraints
* Sleeping State

---

## Acceptance Criteria

* Deterministic simulation.
* Fixed timestep only.
* Immutable collision events.
* Replaceable backend.
