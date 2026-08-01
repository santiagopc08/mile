# EB-010 — Transaction Commit

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-005 World Transactions
- RFC-007 Event Bus

---

## 1. Purpose

This document defines how pending Operations become committed World
State.

Transaction Commit is the only phase allowed to mutate simulation state.

---

## 2. Goals

Transaction Commit SHALL:

- apply Operations atomically;
- validate every mutation;
- preserve consistency;
- generate Events.

No other Runtime stage SHALL modify World State.

---

## 3. Pipeline

```text
Transaction Queue
  ↓
Validation
  ↓
Conflict Resolution
  ↓
Operation Ordering
  ↓
Commit
  ↓
Event Generation
  ↓
Snapshot Update
```

---

## 4. Validation

Every Operation SHALL be validated.

Checks include:

- entity exists;
- component exists;
- schema compatibility;
- ownership;
- lifecycle;
- permissions.

Invalid Operations SHALL fail.

---

## 5. Conflict Resolution

Detect:

- Write / Write
- Create / Create
- Delete / Update
- Delete / Delete

Runtime Policy determines resolution.

---

## 6. Ordering

Operations SHALL execute deterministically.

Example:

```text
Create Entity
  ↓
Add Components
  ↓
Create Relationships
  ↓
Update Components
  ↓
Destroy Components
  ↓
Destroy Entity
```

---

## 7. Commit

Apply Operations.

Each Operation SHALL either:

- Complete
- Fail

The Transaction SHALL remain atomic.

---

## 8. Event Generation

Every committed mutation MAY generate Events.

Examples:

- EntityCreated
- EntityDestroyed
- ComponentAdded
- ComponentRemoved
- RelationshipCreated
- RelationshipRemoved

---

## 9. Snapshot Update

Once Commit succeeds:

```text
Current Snapshot  →  New Snapshot
```

Queries in the next Frame SHALL observe the new Snapshot.

---

## 10. Rollback

If atomicity cannot be guaranteed:

```text
Abort Transaction
  ↓
Rollback
  ↓
Diagnostics
  ↓
Continue or Stop (Runtime Policy)
```

---

## 11. Diagnostics

Expose:

- operations committed;
- operations rejected;
- rollback count;
- conflicts;
- commit duration.

---

## 12. Invariants

- World mutation occurs only here.
- Transactions are atomic.
- Snapshots remain consistent.
- Commit order is deterministic.

---

## 13. Completion

Control transfers to EB-011 Event Dispatch.
