# EB-006 — Command Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-006 Command Bus
- RFC-013 Processing Contracts

---

## 1. Purpose

This document describes how Commands enter the simulation.

Commands express requested behavior.

Commands SHALL NOT modify simulation directly.

---

## 2. Pipeline

```text
Command Queue
  ↓
Validation
  ↓
Authorization
  ↓
Scheduling
  ↓
Processing
  ↓
Intent Generation
  ↓
Transaction Queue
```

---

## 3. Queue

Commands SHALL be dequeued in deterministic order.

Priority SHALL be respected.

---

## 4. Validation

Validate:

- Schema
- Version
- Required Fields
- Expiration
- Duplicates

Invalid Commands SHALL be rejected.

---

## 5. Authorization

Capabilities MAY authorize Commands.

Rejected Commands SHALL terminate.

---

## 6. Scheduling

Scheduler SHALL determine execution order.

Independent Commands MAY execute in parallel.

Observable order SHALL remain deterministic.

---

## 7. Processing

Processing Units consume Commands.

Processing SHALL NOT mutate World.

Processing SHALL generate Intents.

---

## 8. Intent Generation

Example:

```text
MoveCommand        →  MovementIntent
FireWeaponCommand  →  ShootIntent
DestroyCommand     →  DestroyEntityIntent
```

---

## 9. Transaction Queue

Generated Intents SHALL enter the Transaction Queue.

No Intent SHALL bypass Transactions.

---

## 10. Diagnostics

Expose:

- commands executed;
- rejected commands;
- duplicate commands;
- authorization failures;
- queue latency.

---

## 11. Invariants

- Commands never mutate World.
- Commands always generate Intents.
- Transactions own state mutation.
- Ordering is deterministic.

---

## 12. Completion

Control transfers to EB-007 Scheduler.
