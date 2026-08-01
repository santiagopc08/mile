# Global Rule — Runtime Profiler Interface

## Purpose

Every long-lived Engine subsystem SHALL expose a standardized Runtime Profiler Interface.

The Profiler SHALL consume these interfaces without modifying subsystem implementations.

---

## Required Metrics

Every profiled subsystem SHALL expose:

```text
Current State

CPU Time

Memory Usage

Peak Memory

Active Objects

Lifetime Statistics
```

Optional metrics MAY include queue sizes, cache hit rates or subsystem-specific counters.

---

## Requirements

* Read-only access.
* Zero gameplay side effects.
* Low runtime overhead.
* Thread-safe queries.
* Deterministic values.
