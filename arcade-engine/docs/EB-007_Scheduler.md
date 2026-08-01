# EB-007 — Scheduler

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-004 Scheduler
- RFC-013 Processing Contracts

---

## 1. Purpose

The Scheduler determines the execution order of Processing Units for the
current Frame.

The Scheduler SHALL maximize safe parallelism while preserving
deterministic execution.

The Scheduler SHALL NOT execute Processing Units directly.

---

## 2. Input

```text
Processing Contracts
  ↓
Execution Graph
  ↓
Frame Context
```

---

## 3. Scheduler Pipeline

```text
Execution Graph
  ↓
Dependency Analysis
  ↓
Conflict Detection
  ↓
Worker Assignment
  ↓
Execution Schedule
```

---

## 4. Dependency Analysis

Analyze:

- Contract dependencies
- Stage dependencies
- Resource dependencies

Output: Execution DAG

---

## 5. Conflict Detection

Detect:

- Read / Write
- Write / Write
- Stage violations
- Circular dependencies

Conflicting nodes SHALL NOT execute concurrently.

---

## 6. Parallel Groups

The Scheduler SHALL partition the graph into Execution Groups.

Example:

```text
Group A (Movement, Animation, AI)
  ↓
Barrier
  ↓
Group B (Physics)
  ↓
Barrier
  ↓
Group C (Projection)
```

---

## 7. Worker Assignment

Assign every Processing Unit to an available Worker.

Assignment MAY vary.

Observable behavior SHALL remain identical.

---

## 8. Execution

Workers execute Processing Units.

Scheduler waits for every synchronization barrier.

No barrier MAY be skipped.

---

## 9. Completion

Execution completes when:

```text
every Processing Unit  →  Completed
```

---

## 10. Diagnostics

Expose:

- worker utilization;
- execution graph depth;
- execution graph width;
- parallel efficiency;
- idle workers;
- synchronization time.

---

## 11. Invariants

- Execution Graph is acyclic.
- Conflicting Processing Units never execute concurrently.
- Synchronization barriers are respected.
- Scheduling remains deterministic.

---

## 12. Completion

Control transfers to EB-008 Query Execution.
