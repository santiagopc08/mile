# RFC-006 — Command Bus

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- PS-011 Interaction Model
- RFC-003 Execution Pipeline
- RFC-005 World Transactions

---

## 1. Abstract

This RFC defines the Command Bus used by the ORBIT Runtime.

The Command Bus is responsible for receiving, validating, routing,
prioritizing and dispatching Commands.

Commands represent intentions to modify simulation state.

The Command Bus SHALL NOT modify simulation state directly.

State modifications SHALL occur exclusively through Transactions.

This document is normative.

---

## 2. Motivation

Commands are the only legal mechanism through which external actors
request modifications to simulation state.

By centralizing command handling, the Runtime guarantees deterministic
execution, validation and observability.

---

## 3. Terminology

The key words SHALL, SHALL NOT, MUST, MUST NOT, SHOULD and MAY
are interpreted as described in RFC 2119.

---

## 4. Command Definition

A Command expresses an intent.

A Command:

- requests work;
- may be accepted;
- may be rejected;
- may be delayed;
- never represents an accomplished fact.

Examples:

- MovePlayer
- Jump
- SpawnEntity
- SaveGame
- OpenDoor

---

## 5. Command Lifecycle

```text
Created
  ↓
Submitted
  ↓
Validated
  ↓
Queued
  ↓
Dispatched
  ↓
Processed
  ↓
Completed  or  Rejected
```

---

## 6. Command Model

```text
Input
  ↓
Command Bus
  ↓
Validation
  ↓
Priority Queue
  ↓
Dispatcher
  ↓
Processing Unit
  ↓
Transaction
```

The Command Bus never executes gameplay.

---

## 7. Command Descriptor

Every Command SHALL expose:

```yaml
id: gameplay.move
version: 1.0
issuer: InputCapability
payload:
  direction: Vector2
  speed: Float
priority: Normal
reliable: true
replayable: true
```

Required fields:

- id
- version
- payload

Optional:

- correlationId
- timestamp
- metadata
- tags
- deadline

---

## 8. Validation

Every submitted Command SHALL be validated.

Validation includes:

- schema validation;
- payload validation;
- issuer validation;
- capability availability;
- authorization;
- execution context.

Invalid Commands SHALL be rejected.

---

## 9. Queueing

Commands SHALL enter a Queue.

Queue ordering SHALL be deterministic.

Ordering criteria:

1. Priority
2. Timestamp
3. Submission Order

---

## 10. Priorities

The Runtime SHALL support:

- Critical
- High
- Normal
- Low
- Debug

Priority SHALL NOT violate determinism.

---

## 11. Dispatch

Dispatch transfers ownership of the Command
to the appropriate Processing Unit.

The Command Bus SHALL NOT execute Commands itself.

---

## 12. Reliability

A Command MAY be:

- Reliable
- BestEffort

Reliable Commands SHALL be acknowledged.

---

## 13. Idempotency

Commands SHOULD declare whether they are idempotent.

Example:

```yaml
idempotent: true
```

This enables retries.

---

## 14. Cancellation

Commands MAY be cancelled before Dispatch.

Cancelled Commands SHALL NOT produce Transactions.

---

## 15. Expiration

Commands MAY define expiration.

Expired Commands SHALL be discarded.

---

## 16. Replay

Replayable Commands SHALL preserve:

- payload
- issuer
- timestamp
- ordering

---

## 17. Diagnostics

The Runtime SHALL expose:

- queue size
- rejected commands
- latency
- throughput
- retries
- failures

---

## 18. Security

The Runtime MAY reject Commands from unauthorized issuers.

Authorization SHALL occur before Queueing.

---

## 19. Error Handling

```text
Validation Error  →  Rejected
Dispatch Error    →  Retry  →  Reject
Processor Failure →  No Transaction  →  Diagnostics
```

---

## 20. Invariants

- Commands express intent.
- Commands never mutate state.
- Commands are immutable after submission.
- Every Command has exactly one issuer.
- Commands are processed in deterministic order.
- Transactions originate only from processed Commands.

---

## 21. Conformance

An implementation conforms if it:

- validates Commands;
- queues deterministically;
- dispatches without executing;
- preserves ordering;
- maintains all invariants.
