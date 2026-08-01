# HANDBOOK-020 — Serialization

## Purpose

Define serialization architecture.

---

## Responsibilities

Serialization SHALL support:

* Runtime
* Editor
* Assets
* Saves
* Prefabs

---

## Formats

Support:

```text
JSON

Binary
```

---

## Versioning

Every serialized object SHALL contain:

```text
Version

Type

UUID
```

---

## References

Object references SHALL use UUIDs.

Memory addresses SHALL NOT be serialized.

---

## Object Rules

Serializable objects SHALL expose:

```cpp
serialize()

deserialize()
```

---

## Compatibility

Backward compatibility SHALL be maintained within the same major version.

---

## Acceptance Criteria

* Deterministic output.
* Versioned data.
* Stable references.
