# PS-006 — World Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the World Model of ORBIT Arcade Platform.

A World is the primary simulation container managed by a Runtime Instance.

Worlds own runtime entities and define simulation boundaries.

Worlds are independent execution spaces.

---

## 2. Scope

This specification defines:

- World definition
- World ownership
- World lifecycle
- World boundaries
- World relationships

This specification does not define:

- Scenes
- Rendering
- Physics
- Navigation
- ECS internals

Those subjects are defined by dedicated specifications.

---

## 3. World Definition

A World is an isolated simulation space.

Worlds contain runtime state.

Worlds own Actors.

Worlds expose deterministic execution boundaries.

A World is not a visual concept.

A World is not a scene graph.

A World is not a renderer.
