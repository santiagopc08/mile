# HANDBOOK-003 — Memory Model

## Purpose

Define ownership, allocation and lifetime rules.

---

## Ownership

Every allocation SHALL have exactly one owner.

Ownership SHALL be explicit.

---

## Allowed Ownership Models

```text
Unique Ownership

Shared Ownership

Weak Reference

Borrowed Reference
```

---

## Forbidden

* Implicit ownership.
* Hidden ownership transfer.
* Raw owning pointers.

---

## Allocation Strategy

Preferred order:

```text
Stack

↓

Arena

↓

Pool

↓

Heap
```

Heap allocation inside frame-critical code SHOULD be avoided.

---

## Memory Resources

Provide:

```text
Frame Allocator

Arena Allocator

Pool Allocator

Linear Allocator

Heap Allocator
```

---

## Resource Lifetime

```text
Static

Application

Module

Scene

Frame

Temporary
```

Lifetime SHALL be documented.

---

## Containers

Preferred:

```text
std::vector

std::array

std::span

std::string_view

std::optional

std::expected
```

Avoid node-based containers unless justified.

---

## RAII

Every resource SHALL use RAII.

Manual cleanup is forbidden.

---

## Asset Ownership

Assets SHALL be owned exclusively by the Asset Framework.

Subsystems SHALL only store Asset Handles.

---

## Leak Policy

Memory leaks SHALL fail CI.

---

## Acceptance Criteria

* Zero leaks.
* Explicit ownership.
* RAII everywhere.
* Deterministic destruction.
