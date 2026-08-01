# HANDBOOK-024 — Performance Guidelines

## Purpose

Define platform performance budgets.

---

## Runtime Budget

```text
Target FPS

60
```

```text
Frame Budget

16.6 ms
```

---

## Startup

```text
Runtime

<500 ms
```

```text
Editor

<2 s
```

---

## Memory

Zero leaks.

Stable allocations.

No per-frame heap allocation in critical systems.

---

## Asset Loading

Incremental.

Cached.

Asynchronous where possible.

---

## Rendering

Minimize:

* Draw Calls
* State Changes
* GPU Uploads

---

## Physics

Fixed timestep only.

---

## Acceptance Criteria

* Performance budgets met.
* Stable frame time.
* Deterministic execution.
