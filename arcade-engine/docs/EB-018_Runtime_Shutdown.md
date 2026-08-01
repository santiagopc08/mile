# EB-018 — Runtime Shutdown

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-001 Runtime Lifecycle

---

## 1. Purpose

This document defines the orderly shutdown of the Runtime.

Shutdown SHALL leave the system in a consistent state.

---

## 2. Shutdown Pipeline

```text
Running
  ↓
Stop Requested
  ↓
Finish Current Frame
  ↓
Stop Accepting Input
  ↓
Flush Transactions
  ↓
Dispatch Remaining Events
  ↓
Stop Plugins
  ↓
Release Assets
  ↓
Release Resources
  ↓
Dispose Worlds
  ↓
Dispose Runtime
  ↓
Process Exit
```

---

## 3. Stop Request

Shutdown MAY be initiated by:

- User
- Application
- Fatal Error
- Operating System

---

## 4. Frame Completion

The current Frame SHALL complete whenever possible.

Partial Frames SHALL NOT be committed.

---

## 5. Transaction Flush

Pending Transactions SHALL either:

- Commit
- Rollback

No Transaction SHALL remain pending.

---

## 6. Event Flush

Queued Events SHALL be dispatched.

Deferred Events MAY be discarded according to Runtime Policy.

---

## 7. Plugin Shutdown

Plugins SHALL transition to Stopping.

Shutdown order SHALL be the reverse of initialization.

---

## 8. Resource Release

Release:

- Assets
- Resources
- GPU objects
- Threads
- Allocators

---

## 9. Runtime Disposal

Destroy:

- Scheduler
- Worlds
- Registries
- Diagnostics
- Runtime

---

## 10. Diagnostics

Publish final:

- execution summary;
- memory usage;
- shutdown duration;
- unreleased resources;
- fatal errors.

---

## 11. Invariants

- No Frame begins after Stop Requested.
- No Plugin survives Runtime disposal.
- Shutdown order is deterministic.
- Runtime exits only after cleanup completes.

---

## 12. Completion

The operating system regains full ownership of the process.
