# EB-012 — Projection Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-009 Projection Pipeline

---

## 1. Purpose

Projection transforms simulation state into presentation state.

Projection isolates gameplay from rendering.

Simulation SHALL remain unaware of rendering.

---

## 2. Pipeline

```text
Committed Snapshot
  ↓
Projection Units
  ↓
Presentation Models
  ↓
Presentation State
  ↓
Renderer Input
```

---

## 3. Snapshot

Projection receives an immutable committed Snapshot.

Projection SHALL NOT modify it.

---

## 4. Projection Units

Each Projection Unit transforms simulation information.

Examples:

```text
Transform       →  Renderable Transform
Health          →  Health Bar
Animation       →  Animation State
Inventory       →  HUD Model
```

---

## 5. Presentation Models

Presentation Models SHALL contain only renderable data.

They SHALL exclude simulation logic.

---

## 6. Aggregation

Projection MAY combine multiple simulation objects.

Example:

```text
Player  ┐
Weapon  ├→  Rendered Character
Camera  ┘
```

---

## 7. Output

Projection produces Presentation State.

Presentation State SHALL remain immutable during Rendering.

---

## 8. Lifetime

```text
Snapshot
  ↓
Projection
  ↓
Presentation
  ↓
Dispose
```

---

## 9. Diagnostics

Expose:

- projected entities;
- generated presentation models;
- projection duration;
- cache hits.

---

## 10. Invariants

- Projection never mutates World.
- Presentation is read-only.
- Simulation remains isolated.
- Projection is deterministic.

---

## 11. Completion

Control transfers to EB-013 Rendering Pipeline.
