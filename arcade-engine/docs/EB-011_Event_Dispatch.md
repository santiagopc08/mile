# EB-011 — Event Dispatch

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-007 Event Bus

---

## 1. Purpose

This document defines how committed Events are delivered to interested
Capabilities.

Events describe facts that already occurred.

Events SHALL NOT mutate World directly.

---

## 2. Pipeline

```text
Committed Events
  ↓
Event Queue
  ↓
Ordering
  ↓
Subscriber Resolution
  ↓
Dispatch
  ↓
Completion
```

---

## 3. Event Queue

Events enter the queue after Commit.

No Event SHALL bypass the queue.

---

## 4. Ordering

Dispatch SHALL preserve deterministic ordering.

Ordering SHALL be stable.

---

## 5. Subscriber Resolution

Resolve every Subscriber.

Subscribers MAY include:

- Capabilities
- Plugins
- Diagnostics
- Networking
- Replay
- Analytics
- Editor

---

## 6. Dispatch

Deliver Events.

Subscribers SHALL execute independently.

Subscriber failure SHALL NOT invalidate committed Transactions.

---

## 7. Event Lifetime

```text
Create
  ↓
Queue
  ↓
Dispatch
  ↓
Dispose
```

---

## 8. Deferred Events

Subscribers MAY publish new Events.

Deferred Events SHALL execute during a future dispatch cycle.

Recursive dispatch is prohibited.

---

## 9. Diagnostics

Expose:

- dispatched events;
- subscriber count;
- handler duration;
- failed handlers;
- queue latency.

---

## 10. Invariants

- Events represent past facts.
- Dispatch never mutates World.
- Ordering remains deterministic.
- Recursive dispatch is prohibited.

---

## 11. Completion

Control transfers to EB-012 Projection Pipeline.
