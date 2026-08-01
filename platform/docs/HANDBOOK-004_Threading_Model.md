# HANDBOOK-004 — Threading Model

## Purpose

Define concurrency rules.

---

## Thread Types

```text
Main Thread

Worker Threads

IO Thread

Asset Thread

Reserved Threads
```

---

## Responsibilities

### Main Thread

Owns:

* Runtime
* ECS
* Scene Graph
* UI
* Rendering Submission

---

### Worker Threads

Execute:

* Jobs
* Asset Processing
* Background Tasks

---

### IO Thread

Owns:

* File IO
* Package Reading
* Streaming

---

## Job System

Tasks SHALL be independent.

Jobs SHALL not mutate shared state without synchronization.

---

## Synchronization

Allowed:

```text
Mutex

Shared Mutex

Atomic

Semaphore

Latch

Barrier
```

Lock-free preferred where appropriate.

---

## Forbidden

* Busy waiting.
* Recursive locking.
* Hidden synchronization.

---

## Frame Synchronization

```text
Workers

↓

Synchronization Point

↓

Main Thread

↓

Rendering
```

---

## Thread Affinity

Every API SHALL specify:

* Thread-safe.
* Main-thread only.
* Worker-thread only.

---

## Acceptance Criteria

* Deterministic scheduling.
* No race conditions.
* Explicit thread ownership.
