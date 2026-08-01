# Global Rule — Autonomous Validation

## Purpose

Every reusable Engine system SHALL be capable of automatic validation without human interaction.

---

## Validation Controller

Reusable systems SHALL provide an autonomous validation controller.

The controller SHALL:

* Execute predefined scenarios.
* Produce deterministic results.
* Require no user input.
* Be usable from Continuous Integration.

---

## Responsibilities

Validation Controllers SHALL:

* Drive the system.
* Trigger state changes.
* Execute repeatable sequences.
* Report failures.

---

## Forbidden

Validation SHALL NOT depend on:

* Keyboard
* Mouse
* Gamepad
* Manual timing
* Human observation

---

## Diagnostics

Every validation SHALL expose:

* Execution status
* Validation result
* Failure reason
* Performance metrics

---

## Acceptance Criteria

Every Engine contribution SHALL include an autonomous validation scenario.
