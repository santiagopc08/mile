# RFC-008 — Query Model & Execution

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- PS-009 Data Model
- PS-010 Processing Model
- PS-011 Interaction Model
- RFC-004 Scheduler

---

## 1. Abstract

This RFC defines the Query Model used by ORBIT Arcade Platform.

Queries provide deterministic, side-effect-free access to simulation
data.

Queries SHALL NEVER modify simulation state.

This document is normative.

---

## 2. Motivation

Processing Units should describe the data they require instead of
navigating the World directly.

The Query Model decouples storage from processing, allowing Runtime
implementations to optimize data layout while preserving behavior.

---

## 3. Terminology

The key words SHALL, SHALL NOT, MUST, MUST NOT, SHOULD and MAY are
interpreted according to RFC 2119.

---

## 4. Query Definition

A Query is a declarative description of a data request.

A Query:

- selects data;
- filters data;
- projects data;
- never mutates data;
- is deterministic.

Queries are evaluated against a World Snapshot.

---

## 5. Query Lifecycle

```text
Declared
  ↓
Validated
  ↓
Compiled
  ↓
Executed
  ↓
Result Produced
  ↓
Disposed
```

---

## 6. Query Model

```text
Processing Unit
  ↓
Query
  ↓
Query Engine
  ↓
World Snapshot
  ↓
Result Set
```

The Query Engine SHALL NOT expose storage implementation details.

---

## 7. Query Descriptor

Example:

```yaml
query:
  id: movement_query
  world: gameplay
  select:
    - Transform
    - Velocity
  where:
    enabled: true
  order:
    - entityId
```

---

## 8. Query Types

The Runtime SHALL support:

- Entity Queries
- Component Queries
- Relationship Queries
- Tag Queries
- Metadata Queries
- Composite Queries

---

## 9. Filtering

Queries MAY filter using:

- Components
- Tags
- Relationships
- Metadata
- Execution Context
- World
- Region

Filtering SHALL be deterministic.

---

## 10. Projection

Queries MAY project only specific fields.

Example:

`Transform.position` instead of `Transform`

---

## 11. Result Set

The Result Set SHALL be immutable.

Processing Units SHALL NOT modify query results.

---

## 12. Snapshot Isolation

Queries SHALL execute against a consistent World Snapshot.

Partially committed state SHALL NEVER be visible.

---

## 13. Query Optimization

The Runtime MAY:

- cache compiled queries;
- cache indexes;
- reorder internal scans;
- optimize storage access.

Optimizations SHALL NOT alter observable behavior.

---

## 14. Query Caching

Compiled Queries MAY be reused across Frames.

Cache invalidation SHALL preserve correctness.

---

## 15. Parallel Execution

Independent Queries MAY execute in parallel.

Query execution SHALL remain deterministic.

---

## 16. Diagnostics

The Runtime SHALL expose:

- execution count
- execution time
- cache hit ratio
- cache misses
- result size
- index usage

---

## 17. Failure Handling

```text
Invalid Query       →  Rejected
Missing Components  →  Empty Result
Execution Error     →  Abort Query
```

---

## 18. Invariants

- Queries never mutate state.
- Queries are deterministic.
- Result Sets are immutable.
- Storage remains hidden.
- Snapshots are consistent.

---

## 19. Conformance

An implementation conforms if it:

- executes deterministic Queries;
- guarantees snapshot isolation;
- preserves immutable results;
- hides storage details;
- maintains all invariants.
