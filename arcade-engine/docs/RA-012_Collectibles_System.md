# RA-012 — Collectibles System

Version: 1.0 (Draft)  
Status: Draft  
Category: Gameplay System

---

## Purpose

Manage collectible gameplay objects.

Collectibles SHALL be event-driven.

---

## Collectible Types

- Coin
- Fuel
- Future Extension:
  - Gem
  - Star
  - Boost

---

## Coin

Properties:

- Value
- Position
- Collected Flag
- Animation
- Sound

---

## Fuel

Properties:

- Fuel Amount
- Position
- Collected Flag
- Respawn Policy

---

## Collection Flow

```text
Player
  ↓
Collision
  ↓
Collectible Event
  ↓
Transaction
  ↓
Destroy Collectible
  ↓
HUD Update
  ↓
Audio
```

---

## Spawn Rules

- Initial Spawn
- Checkpoint Spawn
- Runtime Spawn (optional)

---

## Visual Feedback

- Pickup Animation
- Particle Effect
- Floating Text
- Sound Effect

---

## Audio Feedback

- Coin Pickup
- Fuel Pickup

---

## Validation

- Collected once
- No duplicate rewards
- Correct score update
- Correct fuel update
