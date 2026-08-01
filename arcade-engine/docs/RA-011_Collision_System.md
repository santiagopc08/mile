# RA-011 — Collision System

Version: 1.0 (Draft)  
Status: Draft  
Category: Gameplay System

---

## Purpose

Define every collision interaction inside the application.

Collision detection SHALL remain deterministic.

Collision response SHALL be handled by the Physics subsystem.

Gameplay systems SHALL consume collision events only.

---

## Collision Layers

- Vehicle
- Wheel
- Terrain
- Collectible
- Fuel
- Checkpoint
- Trigger
- UI (Non-Collidable)
- Decoration (Non-Collidable)

---

## Collision Matrix

| Pair | Collides |
|---|---|
| Vehicle ↔ Terrain | ✓ |
| Vehicle ↔ Coin | ✓ |
| Vehicle ↔ Fuel | ✓ |
| Vehicle ↔ Checkpoint | ✓ |
| Vehicle ↔ Decoration | ✗ |
| Coin ↔ Terrain | ✗ |
| Fuel ↔ Terrain | ✗ |
| Wheel ↔ Terrain | ✓ |

---

## Collision Types

- Physical Contact
- Trigger
- Sensor
- Raycast
- Overlap

---

## Collision Events

- CollisionEnter
- CollisionStay
- CollisionExit
- TriggerEnter
- TriggerExit

---

## Collision Response

### Terrain

```text
Terrain
  ↓
Apply Friction
  ↓
Apply Suspension
  ↓
Apply Impulse
```

### Coin

```text
Coin → Generate CoinCollected Event
```

### Fuel

```text
Fuel → Generate FuelCollected Event
```

### Checkpoint

```text
Checkpoint → Generate CheckpointReached Event
```

---

## Continuous Collision Detection

Required for:

- Vehicle
- Wheels
- Fuel Pickup
- Coins

---

## Debug

- Collision Bounds
- Contact Points
- Normals
- Penetration Depth
- Layer Visualization

---

## Validation

- No tunneling
- Stable contact
- Deterministic collision order
- Correct event generation
