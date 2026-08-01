# Global Rule — Engine Contribution Policy

## Purpose

Every game milestone SHALL contribute reusable functionality to the Engine.

Game-specific implementations SHALL remain isolated.

Reusable infrastructure SHALL become part of the Engine.

---

## Engine Contribution

Each milestone SHALL identify:

* Engine features introduced.
* Engine features extended.
* Engine features validated.
* Engine features reused.

Implementation SHALL maximize reuse across future games.

---

## Reuse Strategy

Reusable systems SHALL migrate into Engine modules.

Gameplay code SHALL consume public Engine APIs.

Duplicated implementations are forbidden.

---

## Validation

Every Engine contribution SHALL include:

* Validation scene.
* Integration test.
* Documentation update.
* Regression validation.

---

## Acceptance Criteria

A milestone SHALL NOT be considered complete unless:

* The game feature is implemented.
* The Engine gains reusable functionality.
* Future games can consume the new capability without modification.
