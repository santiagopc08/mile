# EB-003 — Runtime Initialization

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- RFC-001 Runtime Lifecycle
- RFC-003 Execution Pipeline
- RFC-014 Plugin System

---

## 1. Purpose

Runtime Initialization creates every runtime object required before the
Main Loop begins.

Initialization follows the previously generated Composition Plan.

---

## 2. Input

```text
Composition Plan
  ↓
Runtime Configuration
```

---

## 3. Initialization Sequence

```text
Composition Plan
  ↓
Runtime
  ↓
Domains
  ↓
Execution Contexts
  ↓
Worlds
  ↓
Capability Instances
  ↓
Scheduler
  ↓
Projection
  ↓
Input
  ↓
Ready
```

---

## 4. Runtime Creation

Instantiate Runtime.

Assign Runtime Identity.

Initialize:

- clock;
- diagnostics;
- event queues;
- command queues.

---

## 5. Domain Creation

Instantiate configured Domains.

Assign identities.

Register with Runtime.

---

## 6. Execution Context Creation

Create every Execution Context.

Examples:

- Gameplay
- Editor
- Replay
- Testing

---

## 7. World Creation

Instantiate Worlds.

Initialize:

- Entity Registry
- Relationship Graph
- Component Storage
- Transaction Manager

---

## 8. Capability Initialization

Follow Composition Plan.

For each Capability:

```text
Construct
  ↓
Inject Contracts
  ↓
Inject Configuration
  ↓
Initialize
  ↓
Register
```

Failure SHALL abort initialization.

---

## 9. Scheduler Creation

Instantiate Scheduler.

Create:

- Execution Slots
- Worker Pools
- Dependency Graph
- Execution Graph

---

## 10. Projection Creation

Initialize:

- Presentation
- Audio
- Networking
- Replay
- Analytics

---

## 11. Input Initialization

Initialize:

- Input Devices
- Mappings
- Action Registry
- Command Factory

---

## 12. Runtime Ready

Transition:

```text
Initializing
  ↓
Running
```

Main Loop MAY begin.

---

## 13. Diagnostics

Expose:

- initialization duration;
- initialized capabilities;
- worlds created;
- scheduler status;
- projection status.

---

## 14. Invariants

- Initialization SHALL occur exactly once.
- Worlds SHALL exist before Processing.
- Scheduler SHALL exist before Frame 1.
- No gameplay Processing SHALL execute before Running.

---

## 15. Completion

The Runtime is considered operational when:

- every Capability is initialized;
- Scheduler is ready;
- Worlds exist;
- Projection is initialized;
- Input is available.

Control passes to EB-004 Main Loop.
