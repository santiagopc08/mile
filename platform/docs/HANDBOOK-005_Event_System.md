# HANDBOOK-005 — Event System

## Purpose

Define Runtime communication.

---

## Event Model

Communication SHALL occur through events.

Direct subsystem coupling is forbidden.

---

## Event Structure

Every event SHALL contain:

```text
Event ID

Type

Timestamp

Source

Payload

Priority
```

---

## Categories

```text
Application

Runtime

Input

Physics

Scene

Assets

Rendering

Audio

Gameplay

UI

Editor
```

---

## Event Flow

```text
Producer

↓

Event Queue

↓

Dispatcher

↓

Subscribers
```

---

## Delivery

Support:

```text
Immediate

Deferred
```

---

## Subscription

Subscribers SHALL register through the Event Bus.

Manual routing is forbidden.

---

## Event Lifetime

Events SHALL be immutable after publication.

---

## Threading

Cross-thread publication SHALL be supported.

Dispatch SHALL occur on the owning thread.

---

## Filtering

Support:

```text
By Type

By Category

By Source

By Priority
```

---

## Diagnostics

Track:

```text
Published Events

Dropped Events

Subscribers

Queue Size

Dispatch Time
```

---

## Acceptance Criteria

* Deterministic delivery.
* Immutable events.
* Thread-safe publication.
* Zero direct subsystem dependencies.
