# IMPLEMENTATION-004 — Dependency Management

Version: 1.0  
Status: Active  
Category: Sprint Contract

---

## Objective

Install and configure external dependencies.

---

## Initial Dependencies

- SDL3
- GLM
- fmt
- Catch2

---

## Dependency Policy

External libraries SHALL remain isolated inside
`third_party/` or package manager configuration.

Runtime code SHALL NOT depend directly on package layout.

---

## Future Dependencies

- Box2D
- SDL_image
- SDL_ttf
- SDL_mixer
- EnTT (evaluation only)

---

## Validation

- All dependencies resolve automatically.
- Fresh clone builds successfully.

---

## Definition of Done

No manual file copying required.
