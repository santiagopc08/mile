# RA2-005 — Enemy AI

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Validate AI systems.

---

## Enemy Types

- Walker
- Jumper
- Flying
- Turret

---

## States

- Idle
- Patrol
- Alert
- Attack
- Recover
- Dead

---

## Detection

- Distance
- Raycast
- Trigger

---

## Behavior

```text
Patrol
  ↓
Detect Player
  ↓
Chase
  ↓
Attack
  ↓
Return
```

---

## Events

- Player Detected
- Player Lost
- Enemy Dead

---

## Validation

- Stable transitions
- No oscillation
- Deterministic AI
