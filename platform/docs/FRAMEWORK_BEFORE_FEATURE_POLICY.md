# Global Rule — Framework Before Feature

## Purpose

Every gameplay mechanic SHALL be implemented as a reusable Engine Framework before being used by a game.

Games SHALL consume Engine Frameworks.

Games SHALL NOT implement Engine functionality locally.

---

## Applies To

Mandatory for:

* Character Controller
* Movement
* Jump
* Combat
* Inventory
* AI
* Weapons
* Health
* Animation
* Dialogue
* Navigation
* Camera
* Interaction
* Multiplayer (future)

---

## Engine Ownership

The Engine SHALL own:

* Generic logic
* Runtime systems
* Public APIs
* Validation
* Diagnostics

Games SHALL own:

* Rules
* Content
* Assets
* Parameters
* Progression

---

## Acceptance Criteria

Every new gameplay feature SHALL identify:

* Engine Framework introduced or reused.
* Game-specific implementation.
* Validation scenario.
