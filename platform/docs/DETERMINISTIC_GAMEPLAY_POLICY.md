# Global Rule — Deterministic Gameplay, Simulation / Presentation Separation, Event Bus & Data-Driven Gameplay Policy

## Purpose

All gameplay-critical simulation across the Engine SHALL be deterministic, strictly separated from presentation layers, communicated via a centralized Event Bus, and fully driven by data assets.

---

## 1. Deterministic Gameplay

### Requirements

Gameplay SHALL produce identical numerical simulation results when executed using:
- Identical inputs
- Identical assets
- Identical simulation frequency (fixed tick rate)

### Scope

Mandatory for:
- Physics abstraction
- Character Controllers
- AI & State Machines
- Gameplay Events & Triggers
- Timelines & Replays

### Forbidden Practices

Gameplay simulation SHALL NOT depend on:
- Render FPS
- Variable delta time (`dt`)
- Frame execution order
- OS thread scheduling or non-deterministic floating-point intrinsics

---

## 2. Global Rule — Simulation / Presentation Separation

### Layer Architecture

```text
Platform
  ↓
Simulation (Authoritative WorldState)
  ↓
Presentation (Visual Representation & Interpolated PresentationState)
  ↓
Renderer
```

- **Simulation Layer**: Owns authoritative world state (Gameplay, Physics, AI, Character State, Inventory, Resources, Events, Time, Navigation).
- **Presentation Layer**: Owns visual representation (Sprite Selection, Animation Frame, Camera View, Audio Playback, UI, Effects, Interpolation).
- **Communication Contract**: Simulation publishes immutable snapshots; Presentation consumes snapshots. Simulation SHALL NEVER access Presentation. Presentation SHALL NEVER mutate Simulation snapshots.

### Mandatory Update Order

```text
Input Buffer → Simulation Tick → Snapshot → Interpolation → Presentation → Renderer
```

This order SHALL remain constant.

---

## 3. Global Rule — Event Bus Architecture

### Purpose

Subsystems SHALL communicate primarily through Runtime Events published to the central Event Bus. Direct subsystem dependencies SHALL be minimized.

### Event Properties

Every Runtime Event SHALL contain:
- `Event ID`
- `Timestamp`
- `Simulation Tick`
- `Priority`
- `Source`
- `Payload`

### Ordering

Events SHALL execute deterministically. Events generated during the same Simulation Tick SHALL preserve stable, deterministic ordering.

---

## 4. Global Rule — Data-Driven Gameplay

### Purpose

Gameplay rules SHALL be configured using data assets rather than hardcoded inside levels or system logic.

### Data Assets

Gameplay SHALL be configured using:
- Timeline Assets
- Trigger Assets
- Behavior Assets
- Animation Graphs
- State Machines
- Configuration Assets

---

## 5. Compliance & Exit Criteria

Every gameplay framework SHALL execute correctly with Presentation disabled. Every gameplay framework SHALL expose deterministic validation controllers capable of verifying hash identity, zero timing drift, and deterministic event propagation.
