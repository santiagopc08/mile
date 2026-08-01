# RA3-004 — Tower System

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Validate autonomous gameplay systems.

---

## Tower Types

- Arrow
- Cannon
- Magic
- Slow
- Splash

---

## States

- Idle
- Acquire Target
- Attack
- Cooldown
- Upgrade
- Sell

---

## Target Selection

- Nearest
- First
- Last
- Strongest
- Weakest

---

## Attack Flow

```text
Acquire
  ↓
Rotate
  ↓
Shoot
  ↓
Cooldown
  ↓
Repeat
```

---

## Validation

- Correct targeting
- Stable cooldown
- Predictable damage
