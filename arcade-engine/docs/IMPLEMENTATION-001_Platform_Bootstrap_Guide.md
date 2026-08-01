# IMPLEMENTATION-001 — Platform Bootstrap Guide

Version: 1.0  
Status: Active  
Category: Implementation Guide

---

## 1. Purpose

This document defines the implementation strategy for the Platform.

Unlike the architectural documents, this guide specifies the practical
execution order of the project.

The objective is to build the Runtime incrementally while continuously
validating every feature through a Reference Application.

---

## 2. Core Principles

### 1. Vertical Slice Development

Every iteration SHALL produce a working executable.

No implementation phase SHALL end without a runnable application.

### 2. Runtime First

Features are implemented inside the Runtime only when required by an
application.

The Runtime SHALL never contain speculative functionality.

### 3. Reference Driven Development

Every Runtime capability SHALL be exercised by at least one Reference
Application.

Unused Runtime code SHALL be considered technical debt.

### 4. Small Iterations

Each sprint SHOULD introduce only one major capability.

Large feature branches SHOULD be avoided.

### 5. Continuous Validation

Every completed feature SHALL be verified through:

- Manual testing
- Automated tests (when applicable)
- Performance validation
- Documentation update

---

## 3. Initial Repository Layout

```text
platform/
    CMakeLists.txt
    docs/
    engine/
        app/
        core/
        graphics/
        input/
        math/
        scene/
        utils/
    third_party/
    assets/
    examples/
        hill_climb/
    tests/
```

---

## 4. Development Order

The implementation SHALL follow this sequence.

### Phase 0

```text
Project Bootstrap → Window → Game Loop → Renderer → Input → Hello World
```

### Phase 1

```text
Sprite Rendering → Camera → Timing → Basic Scene
```

### Phase 2

```text
Physics → Terrain → Vehicle → Camera Follow
```

### Phase 3

```text
HUD → Fuel → Coins → Audio
```

### Phase 4

```text
Menus → Persistence → Settings → Replay
```

---

## 5. Coding Rules

- Every class SHALL have one responsibility.
- Functions SHOULD remain small.
- Global state SHALL be avoided.
- Memory ownership SHALL be explicit.
- Dependencies SHALL point toward lower layers only.

---

## 6. Runtime Rules

- Runtime code SHALL NOT include gameplay logic.
- Reference Applications SHALL own gameplay rules.
- Modules SHALL communicate through events or explicit APIs.

---

## 7. Performance Rules

Every feature SHALL preserve:

- 60 FPS target
- Low memory allocations
- Deterministic update order
- Minimal startup time

---

## 8. Documentation Rules

Every implementation sprint SHALL update:

- Architecture
- Implementation Guide
- Changelog
- Known Limitations

---

## 9. Exit Criteria

The bootstrap phase is complete when:

- The project compiles successfully.
- A window opens.
- The main loop runs.
- Input is processed.
- Rendering works.
- The application exits cleanly.
