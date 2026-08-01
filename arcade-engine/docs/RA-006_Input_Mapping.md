# RA-006 — Input Mapping

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

Define every player interaction supported by the application.

Input SHALL be device-independent.

---

## Supported Devices

- Keyboard
- Mouse
- Gamepad
- Touch
- Virtual Controls

---

## Actions

- Accelerate
- Brake
- Pause
- Restart
- Toggle Debug
- Camera Reset

---

## Default Keyboard Mapping

| Key | Action |
|---|---|
| A | Brake |
| D | Accelerate |
| Left Arrow | Brake |
| Right Arrow | Accelerate |
| Esc | Pause |
| R | Restart |
| F3 | Debug Overlay |

---

## Gamepad Mapping

| Button | Action |
|---|---|
| RT | Accelerate |
| LT | Brake |
| Start | Pause |
| Y | Restart |

---

## Touch Mapping

| Gesture | Action |
|---|---|
| Left Half | Brake |
| Right Half | Accelerate |
| Two Fingers | Pause |

---

## Input Priorities

```text
Pause
  ↓
Restart
  ↓
Gameplay
  ↓
Debug
```

---

## Validation

- Input latency < 16 ms
- No duplicated actions
- No conflicting bindings

---

## Test Cases

- Keyboard only
- Gamepad only
- Touch only
- Keyboard + Gamepad
- Reconnect controller
- Rapid button presses
