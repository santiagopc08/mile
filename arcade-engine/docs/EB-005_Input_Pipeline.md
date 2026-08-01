# EB-005 — Input Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- PS-011 Interaction Model
- RFC-006 Command Bus

---

## 1. Purpose

This document describes how external input becomes Commands.

Input SHALL remain isolated from simulation logic.

Simulation SHALL NEVER access hardware directly.

---

## 2. Input Sources

Examples include:

- Keyboard
- Mouse
- Touch
- Gamepad
- Joystick
- Wheel
- Network
- AI
- Replay
- Editor

---

## 3. Pipeline

```text
Input Device
  ↓
Driver
  ↓
Input Event
  ↓
Mapping
  ↓
Action
  ↓
Command
  ↓
Command Queue
```

---

## 4. Device Polling

Poll every active Input Device.

Drivers SHALL normalize platform-specific events.

Output: Input Events

---

## 5. Input Events

Input Events are transient.

Examples:

- KeyPressed
- KeyReleased
- MouseMoved
- ButtonPressed
- AxisChanged

---

## 6. Mapping

Mappings convert Input Events into logical Actions.

Example:

```text
Space         →  Jump
A             →  MoveLeft
Gamepad Axis  →  Accelerate
```

---

## 7. Actions

Actions are application concepts.

Actions SHALL NOT mutate simulation.

Examples:

- Move
- Jump
- Brake
- Fire
- Pause

---

## 8. Command Generation

Actions MAY generate one or more Commands.

Example:

```text
Jump  →  PlayerJumpCommand
```

---

## 9. Queueing

Commands SHALL be appended to the Command Queue.

Ordering SHALL preserve Action order.

---

## 10. Replay

Replay input SHALL use the same pipeline.

The Runtime SHALL NOT distinguish between live and replayed input.

---

## 11. Diagnostics

Expose:

- devices;
- polling latency;
- actions generated;
- commands generated;
- dropped events.

---

## 12. Invariants

- Input never mutates World.
- Drivers never create Entities.
- Actions remain deterministic.
- Commands enter through Command Queue only.

---

## 13. Completion

Control transfers to EB-006 Command Pipeline.
