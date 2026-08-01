# EB-015 — Asset Resolution

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- PS-016 Asset Model

---

## 1. Purpose

Assets provide logical objects composed from one or more Resources.

Assets abstract away physical storage.

---

## 2. Pipeline

```text
Asset Request
  ↓
Asset Registry
  ↓
Dependency Resolution
  ↓
Resource Resolution
  ↓
Instantiation
  ↓
Ready Asset
```

---

## 3. Asset Lookup

Locate Asset by Identity.

Asset identities SHALL be unique.

---

## 4. Dependency Resolution

Resolve dependent Assets.

Example:

```text
Character
  ↓
Mesh
  ↓
Textures
  ↓
Animations
  ↓
Materials
  ↓
Shaders
```

---

## 5. Resource Resolution

Resolve every Resource referenced by the Asset.

Resources SHALL already satisfy validation rules.

---

## 6. Instantiation

Construct runtime Asset instance.

Runtime representation is implementation-defined.

---

## 7. Variants

Asset variants MAY exist.

Example:

- Ultra
- High
- Medium
- Low
- Mobile

Variant selection SHALL follow Runtime Policy.

---

## 8. Lifetime

```text
Requested
  ↓
Resolved
  ↓
Instantiated
  ↓
Referenced
  ↓
Released
  ↓
Disposed
```

---

## 9. Diagnostics

Expose:

- resolved assets;
- dependency depth;
- instantiation time;
- failed dependencies.

---

## 10. Invariants

- Assets never expose physical storage.
- Assets remain immutable after creation.
- Dependencies are fully resolved before use.

---

## 11. Completion

Control transfers to EB-016 Plugin Lifecycle.
