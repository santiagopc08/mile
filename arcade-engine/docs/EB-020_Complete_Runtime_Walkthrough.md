# EB-020 — Complete Runtime Walkthrough

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint

---

## Purpose

This document provides a complete end-to-end walkthrough of one Runtime
Frame.

---

## Complete Runtime Sequence

```text
Application
  ↓
orbit run
  ↓
Bootstrap                    (EB-001)
  ↓
Runtime Composition          (EB-002)
  ↓
Runtime Initialization       (EB-003)
  ↓
Running                      (EB-004)
  ↓
Frame Begin
  ↓
Input                        (EB-005)
  ↓
Action Mapping               (EB-005)
  ↓
Commands                     (EB-006)
  ↓
Scheduler                    (EB-007)
  ↓
Queries                      (EB-008)
  ↓
Processing                   (EB-009)
  ↓
Intents                      (EB-009)
  ↓
Operations                   (EB-009)
  ↓
Transaction                  (EB-010)
  ↓
Commit                       (EB-010)
  ↓
Events                       (EB-011)
  ↓
Projection                   (EB-012)
  ↓
Presentation                 (EB-012)
  ↓
Rendering                    (EB-013)
  ↓
Diagnostics                  (EB-017)
  ↓
Frame End
  ↓
Repeat
  ↓
Stop Requested               (EB-018)
  ↓
Shutdown                     (EB-018)
  ↓
Process Exit
```

---

## Runtime Flow

Every Frame SHALL execute exactly this sequence.

No stage MAY be reordered unless explicitly allowed by the corresponding
RFC.

---

## Frame Timeline

```text
Frame N
  ↓
Input
  ↓
Simulation
  ↓
Commit
  ↓
Presentation
  ↓
Render
  ↓
Diagnostics
  ↓
Frame N+1
```

---

## Determinism

Given:

- identical inputs;
- identical configuration;
- identical plugins;
- identical assets;

the Runtime SHALL produce identical observable results.

---

## Architectural Summary

```text
External Input
  ↓
Intent
  ↓
Decision
  ↓
Mutation
  ↓
Fact
  ↓
Projection
  ↓
Presentation
  ↓
Pixels
```
