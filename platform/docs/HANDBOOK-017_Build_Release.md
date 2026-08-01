# HANDBOOK-017 — Build & Release

## Purpose

Define build, packaging and release architecture.

---

## Build Profiles

Support:

```text
Debug

Development

Release
```

---

## Pipeline

```text
Compile

↓

Tests

↓

Cook Assets

↓

Package

↓

Validate

↓

Artifacts
```

---

## Packaging

Support:

```text
Windows

Linux

macOS
```

---

## Versioning

Support:

```text
Semantic Version

Build Number

Commit Hash
```

---

## Release Validation

Every release SHALL validate:

* Tests
* Assets
* Serialization
* Packaging
* Startup

---

## Acceptance Criteria

* Deterministic builds.
* Reproducible artifacts.
* Automated validation.
