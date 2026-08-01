# RA3-005 — Wave Manager

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Control enemy spawning.

---

## Wave

```text
Prepare
  ↓
Spawn
  ↓
Combat
  ↓
Finished
```

---

## Spawn Rules

- Enemy Type
- Quantity
- Interval
- Spawn Point
- Difficulty

---

## Scaling

- Health
- Damage
- Speed
- Armor
- Reward

---

## Events

- Wave Started
- Wave Completed
- Enemy Spawned
- Enemy Escaped

---

## Validation

- Deterministic spawning
- Correct scaling
- Stable timing
