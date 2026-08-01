# RFC-009 — Projection Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- PS-008 Presentation Model
- RFC-003 Execution Pipeline
- RFC-008 Query Model & Execution

---

## 1. Abstract

This RFC defines the Projection Pipeline.

Projection transforms immutable Simulation State into one or more
Projection States.

Projection SHALL NEVER modify Simulation.

This document is normative.

---

## 2. Motivation

Different consumers require different representations of the same
simulation.

Presentation, Audio, Networking and Replay are all Projections.

---

## 3. Projection Definition

A Projection observes Simulation.

A Projection:

- reads state;
- transforms state;
- produces derived state;
- never owns simulation.

---

## 4. Projection Model

```text
Simulation Snapshot
  ↓
Projection Units
  ↓
Projection State
  ↓
Consumers
```

---

## 5. Projection Categories

- Presentation
- Audio
- Networking
- Replay
- Analytics
- Accessibility
- Persistence

---

## 6. Projection Lifecycle

```text
Registered
  ↓
Initialized
  ↓
Executed
  ↓
Published
  ↓
Disposed
```

---

## 7. Projection Units

Projection Units SHALL consume:

- Queries
- Events
- Configuration

Projection Units SHALL produce:

- Projection State

---

## 8. Projection State

Projection State SHALL:

- be immutable;
- be derived;
- be disposable;
- never own simulation.

---

## 9. Views

A Projection MAY expose multiple Views.

Each View SHALL observe exactly one World.

---

## 10. Cameras

Presentation Views MAY define Cameras.

A Camera SHALL define only observation parameters.

---

## 11. Layers

Presentation SHALL organize output through semantic Layers.

Layers SHALL NOT represent rendering APIs.

---

## 12. Projection Ordering

```text
Simulation
  ↓
Commit
  ↓
Events
  ↓
Projection
  ↓
Rendering
```

No Projection SHALL execute before Transactions complete.

---

## 13. Incremental Projection

The Runtime MAY update Projection State incrementally.

Observable behavior SHALL remain unchanged.

---

## 14. Parallel Projection

Independent Projection Units MAY execute concurrently.

Projection ordering SHALL remain deterministic.

---

## 15. Rendering

Rendering SHALL consume Presentation State only.

Rendering SHALL NEVER observe Simulation directly.

---

## 16. Diagnostics

The Runtime SHALL expose:

- projection time
- generated objects
- cache hits
- cache misses
- update latency

---

## 17. Failure Handling

Projection failure SHALL NOT invalidate Simulation.

Projection failures SHALL be isolated.

---

## 18. Invariants

- Simulation is read-only.
- Projection State is immutable.
- Rendering consumes Projection only.
- Views never own state.
- Projection never modifies Simulation.

---

## 19. Conformance

An implementation conforms if it:

- executes Projection after Transactions;
- produces immutable Projection State;
- isolates Projection failures;
- preserves deterministic ordering;
- maintains all invariants.
