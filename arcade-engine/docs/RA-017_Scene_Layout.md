# RA-017 — Scene Layout

Version: 1.0 (Draft)  
Status: Draft  
Category: Production

---

## Purpose

Define every scene composing the application.

Scenes SHALL remain independent.

---

## Scene Graph

```text
Bootstrap
  ↓
Splash
  ↓
Main Menu
  ↓
Gameplay
  ↓
Pause Overlay
  ↓
Settings
  ↓
Game Over
```

---

## Gameplay Scene

```text
Environment
  ↓
Terrain
  ↓
Vehicle
  ↓
Camera
  ↓
Collectibles
  ↓
Lighting
  ↓
HUD
  ↓
Audio
```

---

## Bootstrap Scene

- Initialize Runtime
- Load Configuration
- Load Save
- Preload Assets

---

## Main Menu

- Logo
- Play
- Settings
- Exit

---

## Gameplay

- Vehicle
- Terrain
- Camera
- HUD
- Physics
- Audio

---

## Pause

- Blur
- Resume
- Restart
- Settings
- Exit

---

## Game Over

- Statistics
- Restart
- Exit

---

## Validation

- No circular transitions
- Independent loading
- Deterministic initialization
