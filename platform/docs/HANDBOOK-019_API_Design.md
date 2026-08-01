# HANDBOOK-019 — API Design Guidelines

## Purpose

Define mandatory rules for all public APIs.

---

## Principles

Every API SHALL be:

* Minimal
* Deterministic
* Explicit
* Stable
* Testable

---

## Interface Rules

Public APIs SHALL expose behavior.

Implementation details SHALL remain private.

---

## Parameter Rules

Prefer:

```cpp
const T&
```

For input.

Prefer:

```cpp
T&&
```

For ownership transfer.

Prefer:

```cpp
std::span<T>
```

For contiguous collections.

Avoid output parameters.

---

## Return Types

Use:

```cpp
void
```

For side effects.

```cpp
T
```

For values.

```cpp
std::optional<T>
```

For optional results.

```cpp
std::expected<T, Error>
```

For recoverable failures.

---

## Ownership

APIs SHALL document ownership.

Ownership SHALL never be ambiguous.

---

## Thread Safety

Every public API SHALL declare:

```text
Thread Safe

Main Thread Only

Worker Thread Only
```

---

## Error Model

Recoverable failures SHALL NOT throw exceptions.

Fatal failures SHALL fail explicitly.

---

## ABI Stability

Public interfaces SHALL remain source compatible within the same major version.

---

## Acceptance Criteria

* Stable interfaces.
* Explicit ownership.
* Documented thread safety.
* Explicit error handling.
