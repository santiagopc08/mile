# EB-004 — Main Loop

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- PS-005 Execution Model
- RFC-003 Execution Pipeline
- RFC-004 Scheduler

---

## 1. Purpose

This document defines the Main Loop executed by an ORBIT Runtime.

The Main Loop repeatedly executes deterministic Frames until the Runtime
transitions to Stopping.

The Main Loop owns the lifetime of every Frame.

---

## 2. Goals

The Main Loop SHALL:

- preserve deterministic execution;
- execute every pipeline stage in order;
- maintain a consistent simulation state;
- collect diagnostics.

The Main Loop SHALL NOT:

- create Runtime objects;
- compose Capabilities;
- modify Contracts.

---

## 3. Main Loop

```text
Running
  ↓
Begin Frame
  ↓
Input Pipeline
  ↓
Command Pipeline
  ↓
Scheduler
  ↓
Processing
  ↓
Transaction Commit
  ↓
Event Dispatch
  ↓
Projection
  ↓
Rendering
  ↓
Diagnostics
  ↓
End Frame
  ↓
Repeat
```

---

## 4. Runtime Loop

Pseudo Sequence:

```text
while Runtime == Running
    Begin Frame
    Execute Frame
    End Frame
```

---

## 5. Begin Frame

Responsibilities:

- update clock;
- increment frame counter;
- compute delta time;
- clear transient buffers;
- reset frame diagnostics.

Output: Frame Context

---

## 6. Execute Frame

Execution SHALL occur through the Execution Pipeline.

No stage SHALL be skipped.

No stage SHALL execute twice.

---

## 7. End Frame

Responsibilities:

- flush diagnostics;
- publish metrics;
- release temporary allocations;
- present frame.

---

## 8. Frame Context

Every Frame SHALL own:

- Frame Number
- Delta Time
- Elapsed Time
- Execution Context
- Diagnostics
- Temporary Memory

---

## 9. Frame Boundaries

Every mutation SHALL occur inside exactly one Frame.

No mutation SHALL survive beyond its Frame without Commit.

---

## 10. Runtime State Changes

The Main Loop SHALL terminate when:

```text
Runtime == Stopping
or
Fatal Error
```

---

## 11. Diagnostics

Expose:

- frame duration;
- stage timings;
- FPS;
- skipped frames;
- idle time.

---

## 12. Invariants

- Every Frame has one Begin.
- Every Frame has one End.
- Stages execute exactly once.
- Frame order is deterministic.

---

## 13. Completion

Control transfers to EB-005 Input Pipeline.
