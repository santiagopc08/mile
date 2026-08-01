# GAME-001 — Global Definition of Done (DoD)

## Purpose

The following criteria SHALL be appended to every milestone unless explicitly overridden.

---

## Build

* Project SHALL compile successfully.
* Zero compilation errors.
* Zero compilation warnings.
* All supported build configurations SHALL succeed.

---

## Validation

* Validation scene SHALL execute successfully.
* Validation scene SHALL demonstrate all implemented features.
* Runtime SHALL remain stable during execution.
* Previous milestones SHALL continue functioning correctly.

---

## Testing

* Unit tests SHALL pass.
* Integration tests SHALL pass.
* Regression tests SHALL pass when applicable.

---

## Memory

* Zero memory leaks.
* Zero resource leaks.
* Zero invalid memory accesses.
* All owned resources SHALL be released.

---

## Performance

* No unnecessary allocations during gameplay.
* Frame time SHALL remain stable.
* No performance regressions.

---

## Cross Platform

Implementation SHALL compile and execute on:

* Windows
* Linux
* macOS

Platform-specific code SHALL remain isolated.

---

## Documentation

Every public API SHALL document:

* Purpose
* Parameters
* Return values
* Lifetime
* Thread Safety

Implementation notes SHALL be updated when required.

---

## Architecture

* Implementation SHALL comply with the Architecture Handbook.
* Architectural violations SHALL be considered defects.

---

## Reusability

* The implementation SHALL be reusable by future games.
* Game-specific assumptions SHALL remain isolated.

---

## Exit Criteria

A milestone SHALL NOT be considered complete until all Definition of Done requirements have been satisfied.
