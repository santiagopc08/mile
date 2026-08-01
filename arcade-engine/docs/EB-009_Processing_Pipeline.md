# EB-009 — Processing Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-013 Processing Contracts
- RFC-005 World Transactions

---

## 1. Purpose

This document defines how Processing Units transform simulation state.

Processing computes decisions.

Processing SHALL NEVER modify World state directly.

---

## 2. Pipeline

```text
Immutable Result Set
  ↓
Processing Unit
  ↓
Business Logic
  ↓
Intent Generation
  ↓
Operation Generation
  ↓
Transaction Queue
```

---

## 3. Processing Unit

Receive:

- Queries
- Configuration
- Services
- Frame Context

Produce:

- Operations
- Events
- Diagnostics

---

## 4. Business Logic

Processing SHALL perform:

- calculations
- decision making
- AI
- physics
- animation
- rules

Business Logic SHALL remain deterministic.

---

## 5. Intent Generation

Processing expresses desired changes through Intents.

Examples:

- DamageEntity
- SpawnProjectile
- MoveVehicle
- DestroyEntity

---

## 6. Operation Generation

Each Intent is translated into one or more Operations.

Examples:

- Update Component
- Create Entity
- Destroy Entity
- Add Relationship
- Remove Component

Operations SHALL remain implementation-independent.

---

## 7. Transaction Queue

Operations are appended to the current Transaction.

No Operation SHALL mutate World immediately.

---

## 8. Events

Processing MAY propose Events.

Events SHALL NOT be published before Transaction Commit.

---

## 9. Completion

Processing completes when every Operation has been queued.

---

## 10. Diagnostics

Expose:

- processing duration;
- operations generated;
- events proposed;
- rejected operations;
- execution count.

---

## 11. Invariants

- Processing never mutates World.
- Operations remain ordered.
- Events remain deferred.
- Determinism is preserved.

---

## 12. Completion

Control transfers to EB-010 Transaction Commit.
