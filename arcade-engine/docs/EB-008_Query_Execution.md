# EB-008 — Query Execution

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-008 Query Model
- RFC-013 Processing Contracts

---

## 1. Purpose

This document describes how Processing Units retrieve simulation data.

Queries provide read-only access to a consistent World Snapshot.

---

## 2. Input

```text
World Snapshot
  ↓
Query Contract
  ↓
Processing Unit
```

---

## 3. Query Pipeline

```text
Query
  ↓
Validation
  ↓
Compilation
  ↓
Optimization
  ↓
Execution
  ↓
Immutable Result Set
```

---

## 4. Validation

Validate:

- Schema
- Components
- Filters
- Relationships
- Execution Context

Invalid Queries SHALL fail immediately.

---

## 5. Compilation

Compiled Queries MAY be cached.

Compilation SHALL be deterministic.

---

## 6. Optimization

The Runtime MAY:

- reuse indexes;
- reuse compiled plans;
- reorder storage access;
- eliminate redundant filters.

Optimization SHALL NOT alter observable behavior.

---

## 7. Execution

Queries execute against the current World Snapshot.

Queries SHALL NOT observe partially committed state.

---

## 8. Result Set

Result Sets SHALL be immutable.

Processing Units SHALL NOT modify query results.

---

## 9. Snapshot Consistency

Every Query executed during a Frame SHALL observe the same committed
Snapshot.

No Query SHALL observe in-flight Transactions.

---

## 10. Query Lifetime

```text
Create
  ↓
Execute
  ↓
Return Result
  ↓
Dispose
```

---

## 11. Diagnostics

Expose:

- execution time;
- cache hit ratio;
- scanned entities;
- returned entities;
- index usage.

---

## 12. Invariants

- Queries never mutate World.
- Result Sets are immutable.
- Snapshots are consistent.
- Storage layout remains hidden.

---

## 13. Completion

Control transfers to EB-009 Processing Pipeline.
