# RA-004 — ECS Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Entities

- Vehicle
- Driver
- Wheel Front
- Wheel Rear
- Terrain
- Coin
- Fuel
- Camera
- HUD
- Background
- Checkpoint

---

## Components

- Transform
- RigidBody
- Collider
- Wheel
- Engine
- Suspension
- FuelTank
- CoinValue
- Lifetime
- Sprite
- Mesh
- AudioSource
- CameraFollow
- Velocity
- Rotation
- Health
- DistanceTracker

---

## Relationships

```text
Vehicle
  ├── Front Wheel
  ├── Rear Wheel
  └── Camera Target
```

```text
Coin
  ↓
Collected By
  ↓
Vehicle
```

```text
Terrain
  ↓
Contains
  ↓
Checkpoint
```

---

## Tags

- Player
- Collectible
- Obstacle
- Ground
- UI
