# PS-008 — Presentation Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the Presentation Model of ORBIT Arcade Platform.

Presentation transforms simulation state into renderable state.

Presentation is read-only.

Presentation never modifies simulation.

Rendering consumes Presentation.

Simulation never depends on Rendering.

---

## 2. Scope

This specification defines:

- Presentation
- Views
- Cameras
- Presentation Graph
- Visual state

This specification does not define:

- rendering APIs
- shaders
- graphics hardware
- meshes
- textures
