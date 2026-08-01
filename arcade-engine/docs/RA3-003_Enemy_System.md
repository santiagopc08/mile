# RA3-003 — Enemy System

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Define enemy lifecycle.

---

## States

- Spawn
- Walk
- Attack
- Dead
- Despawn

---

## Components

- Transform
- Health
- Speed
- PathFollower
- Reward
- Armor
- Damage

---

## Behavior

```text
Spawn
  ↓
Follow Path
  ↓
Reach Base
  ↓
Damage Base
  ↓
Despawn
```

---

## Death

```text
Health <= 0
  ↓
Reward Player
  ↓
Generate Event
  ↓
Destroy Entity
```

---

## Validation

- Stable movement
- Correct rewards
- No path deviation
