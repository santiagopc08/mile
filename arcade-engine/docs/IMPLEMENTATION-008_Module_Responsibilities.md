# IMPLEMENTATION-008 — Module Responsibilities

Version: 1.0  
Status: Active  
Category: Runtime

---

## engine/app

Application lifecycle.

**Files:**

- `Application.hpp`
- `Application.cpp`
- `main.cpp`

---

## engine/core

Core services.

- Logger
- Time
- Config
- Version

---

## engine/graphics

- Renderer
- Texture
- Camera
- Sprite

---

## engine/input

- Keyboard
- Mouse
- Gamepad
- InputState

---

## engine/math

- Vectors
- Matrices
- Utilities

*(Currently GLM wrappers only)*

---

## engine/scene

- Scene
- GameObject
- Transform

*(Currently simple objects)*

---

## engine/utils

- Helpers
- Filesystem
- String
- UUID
