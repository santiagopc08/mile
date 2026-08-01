# RA-005 — Physics Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Validate the Physics subsystem.

---

## Simulation

60 Hz

---

## Forces

- Gravity
- Engine Torque
- Suspension Force
- Friction
- Drag
- Impact

---

## Vehicle

```text
Rigid Body
  ↓
Wheel Constraints
  ↓
Suspension
  ↓
Ground Contact
```

---

## Terrain

- Static Collider
- Spline Surface

---

## Wheel

- Radius
- Mass
- Grip
- Angular Velocity

---

## Suspension

- Spring
- Damper
- Maximum Travel
- Compression
- Extension

---

## Physics Events

- Wheel Contact
- Vehicle Flip
- Landing
- Collision
- Fuel Pickup
- Coin Pickup

---

## Success Criteria

- Stable vehicle
- Stable suspension
- Continuous collision
- Deterministic simulation
