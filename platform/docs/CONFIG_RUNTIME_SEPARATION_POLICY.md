# Global Rule — Configuration / Runtime State Separation

## Purpose

Every reusable Engine system SHALL separate persistent configuration from transient runtime state.

---

## Configuration

Configuration SHALL contain:

* Serialized data
* Editor-editable properties
* Default values
* Gameplay tuning parameters

Configuration SHALL remain deterministic.

Configuration SHALL NOT contain runtime state.

---

## Runtime State

Runtime State SHALL contain:

* Computed values
* Temporary caches
* Physics state
* Interpolation state
* Internal handles
* Frame-dependent information

Runtime State SHALL NOT be serialized.

---

## Benefits

Every reusable Engine system SHALL support:

* Hot Reload
* Live Tuning
* Serialization
* Deterministic Save/Load
* Editor Integration

---

## Applies To

This rule SHALL apply to:

* Physics
* Rendering
* Audio
* Gameplay
* Animation
* Camera
* Particles
* AI
* Input
* UI
* Navigation
* Networking (future)
