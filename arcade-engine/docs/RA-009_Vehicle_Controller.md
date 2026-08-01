# RA-009 — Vehicle Controller

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Convert player input into vehicle behavior.

---

## Vehicle Structure

```text
Body
  ↓
Front Wheel
  ↓
Rear Wheel
  ↓
Engine
  ↓
Fuel Tank
  ↓
Suspension
```

---

## Inputs

- Accelerate
- Brake

---

## Outputs

- Wheel Torque
- Brake Torque
- Fuel Consumption
- Sound Events
- Animation Events

---

## Engine

- Maximum Torque
- Idle Torque
- Engine Brake
- Maximum RPM

---

## Fuel

- Capacity
- Consumption Rate
- Refill Amount

---

## States

- Idle
- Accelerating
- Braking
- Airborne
- Flipped
- Out Of Fuel
- Destroyed

---

## Runtime Events

- Engine Started
- Engine Stopped
- Fuel Empty
- Fuel Collected
- Vehicle Flipped
- Vehicle Reset

---

## Validation

- Smooth acceleration
- Stable braking
- Deterministic fuel usage
- No torque spikes
