# RFC-007 — Event Bus

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- PS-011 Interaction Model
- RFC-005 World Transactions

---

## 1. Abstract

This RFC defines the Event Bus of ORBIT.

The Event Bus distributes immutable Events describing completed state
changes.

Events SHALL only be emitted after successful Transactions.

Events SHALL NOT modify simulation state.

---

## 2. Motivation

Events decouple producers and consumers while preserving deterministic
simulation.

---

## 3. Event Definition

An Event describes a fact.

Examples:

- EntitySpawned
- ComponentAdded
- PlayerJumped
- DamageApplied
- GameSaved

---

## 4. Event Lifecycle

```text
Created
  ↓
Published
  ↓
Delivered
  ↓
Observed
  ↓
Archived
```

---

## 5. Event Model

```text
Transaction
  ↓
Event Bus
  ↓
Subscribers
  ↓
Projection
  ↓
Diagnostics
```

---

## 6. Event Descriptor

Every Event SHALL expose:

```yaml
id: gameplay.player_moved
version: 1.0
source: GameplayDomain
payload:
  entity: EntityId
  position: Vector3
timestamp: RuntimeTime
sequence: 18442
```

---

## 7. Immutability

Events SHALL be immutable.

Subscribers SHALL NOT modify Events.

---

## 8. Ordering

Events SHALL preserve publication order.

Ordering SHALL be deterministic.

---

## 9. Delivery

Delivery SHALL occur after Transaction Commit.

Never before.

---

## 10. Subscribers

Subscribers MAY include:

- Processing Units
- Projection Units
- Replay
- Networking
- Analytics
- Diagnostics
- UI
- Audio

---

## 11. Subscription

Subscriptions MAY filter:

- event id
- domain
- tags
- source
- entity

---

## 12. Event Categories

- Simulation
- Infrastructure
- Presentation
- Diagnostics
- Networking
- Persistence

---

## 13. Event History

The Runtime MAY retain an Event Log.

Replay SHALL consume the Event Log.

---

## 14. Reliability

Events MAY be:

- Persistent
- Transient
- Reliable
- BestEffort

---

## 15. Diagnostics

Metrics SHALL include:

- published
- delivered
- dropped
- subscribers
- latency
- queue depth

---

## 16. Failure Handling

Subscriber Failure SHALL NOT invalidate the Transaction.

Failures SHALL be isolated.

---

## 17. Security

The Runtime MAY restrict subscriptions.

---

## 18. Event Replay

Replay SHALL reproduce publication order.

Event timestamps SHALL remain stable.

---

## 19. Invariants

- Events describe facts.
- Events never express intent.
- Events are immutable.
- Events are published after Commit.
- Events never modify simulation state.
- Subscribers are isolated.

---

## 20. Conformance

An implementation conforms if it:

- publishes Events after Transactions;
- preserves ordering;
- guarantees immutability;
- isolates subscribers;
- maintains all invariants.
