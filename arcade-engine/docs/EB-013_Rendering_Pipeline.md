# EB-013 — Rendering Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Execution Blueprint  
Implements:
- PS-008 Presentation Model

---

## 1. Purpose

This document defines how Presentation State is transformed into visible
output.

Rendering SHALL consume Presentation State only.

Rendering SHALL NOT access simulation state.

---

## 2. Pipeline

```text
Presentation State
  ↓
Render Graph
  ↓
Render Queue
  ↓
Backend
  ↓
GPU Commands
  ↓
Present
```

---

## 3. Render Graph

The Render Graph defines rendering passes.

Example:

```text
Shadow Pass
  ↓
Geometry Pass
  ↓
Lighting Pass
  ↓
Transparency Pass
  ↓
UI Pass
  ↓
Post Processing
```

---

## 4. Visibility

Determine visible objects.

Techniques MAY include:

- frustum culling;
- occlusion culling;
- LOD selection.

Visibility SHALL NOT alter Presentation State.

---

## 5. Render Queue

Sort renderables.

Sorting MAY consider:

- Material
- Shader
- Depth
- Transparency
- Priority

---

## 6. Backend

Backend implementations MAY include:

- OpenGL
- Vulkan
- Metal
- DirectX
- Software Renderer

Rendering behavior SHALL remain backend-independent.

---

## 7. GPU Command Generation

Generate backend-specific command buffers.

Commands SHALL be immutable once submitted.

---

## 8. Presentation

Submit the completed frame.

Presentation SHALL occur once per Frame.

---

## 9. Diagnostics

Expose:

- draw calls;
- rendered objects;
- culled objects;
- GPU frame time;
- CPU render time;
- backend latency.

---

## 10. Invariants

- Renderer never modifies World.
- Renderer never modifies Presentation State.
- Exactly one Present occurs per Frame.
- Backend differences remain transparent.

---

## 11. Completion

Control transfers to EB-017 Diagnostics Pipeline.
