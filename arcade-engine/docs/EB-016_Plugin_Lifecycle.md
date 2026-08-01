# EB-016 — Plugin Lifecycle

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- PS-018 Extension Model
- RFC-014 Plugin System

---

## 1. Purpose

This document defines the complete lifecycle of a Plugin.

A Plugin represents a deployable unit extending the Runtime through
Contracts and Capabilities.

Plugins SHALL remain isolated from one another.

---

## 2. Lifecycle

```text
Discovered
  ↓
Validated
  ↓
Composed
  ↓
Instantiated
  ↓
Initialized
  ↓
Running
  ↓
Stopping
  ↓
Disposed
```

---

## 3. Discovery

Plugin manifests SHALL be discovered during Runtime Composition.

Discovery SHALL NOT instantiate Plugins.

---

## 4. Validation

Validate:

- Manifest
- Identity
- Version
- Compatibility
- Required Contracts
- Dependencies
- Digital Signature (optional)

Failure SHALL prevent activation.

---

## 5. Composition

Dependencies SHALL be resolved.

Initialization order SHALL follow the Composition Plan.

Circular dependencies SHALL be rejected.

---

## 6. Instantiation

Construct Plugin instance.

No user code SHALL execute during construction.

---

## 7. Initialization

Inject:

- Runtime
- Contracts
- Configuration
- Services

Plugin performs startup logic.

Initialization SHALL be idempotent.

---

## 8. Running

Plugin MAY:

- expose Capabilities;
- consume Contracts;
- subscribe to Events;
- register Queries;
- register Processing Units.

---

## 9. Stopping

Runtime SHALL notify the Plugin.

Plugin SHALL release external resources.

No new work SHALL be accepted.

---

## 10. Disposal

Release:

- memory;
- handles;
- subscriptions;
- worker threads;
- caches.

Disposed Plugins SHALL NOT be reused.

---

## 11. Diagnostics

Expose:

- startup duration;
- shutdown duration;
- initialization failures;
- dependency graph;
- memory usage.

---

## 12. Invariants

- Plugins are isolated.
- Plugins communicate only through Contracts.
- Plugins never access internal Runtime state directly.
- Plugin lifetime is deterministic.

---

## 13. Completion

Control transfers to Runtime execution or Runtime shutdown depending on
current state.
