# HANDBOOK-018 — Coding Standards

## Purpose

Define mandatory coding conventions.

---

## Language

```text
C++23
```

---

## Naming

Namespaces:

```text
orbit::<module>
```

Classes:

```text
PascalCase
```

Functions:

```text
camelCase
```

Members:

```text
m_member
```

Constants:

```text
kConstant
```

---

## Includes

Order:

```text
Module Header

↓

Standard Library

↓

Third-party

↓

Engine
```

---

## Ownership

Mandatory:

* RAII
* const correctness
* move semantics

Forbidden:

* owning raw pointers
* hidden ownership

---

## Error Handling

Recoverable:

```text
std::expected
```

Optional values:

```text
std::optional
```

Exceptions SHALL NOT be used for Runtime control flow.

---

## Documentation

Every public API SHALL document:

* Purpose
* Parameters
* Returns
* Thread Safety
* Lifetime

---

## Acceptance Criteria

* Consistent naming.
* Explicit ownership.
* Self-documenting APIs.
* Zero style violations.
