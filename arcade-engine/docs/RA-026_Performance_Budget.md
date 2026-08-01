# RA-026 — Performance Budget

Version: 1.0 (Draft)  
Status: Draft  
Category: Engineering

---

## Purpose

Define measurable performance targets for the Reference Application.

Performance SHALL be validated continuously during development.

---

## Target Platforms

- Desktop
- Laptop
- Future Mobile

---

## Frame Rate

| Metric | Value |
|---|---|
| Target | 60 FPS |
| Minimum | 30 FPS |
| Frame Time Target | 16.67 ms |
| Maximum Frame Time | 33.33 ms |

---

## CPU Budget

| Subsystem | Budget |
|---|---|
| Gameplay | 4 ms |
| Physics | 3 ms |
| Rendering | 3 ms |
| Audio | 1 ms |
| UI | 1 ms |
| Remaining Budget | 4.67 ms |

---

## GPU Budget

| Metric | Value |
|---|---|
| Target | 8 ms |
| Maximum | 16 ms |

---

## Memory Budget

| Category | Budget |
|---|---|
| Runtime | 256 MB |
| Assets | 512 MB |
| Temporary | 64 MB |
| Audio | 64 MB |
| **Total Target** | **896 MB** |

---

## Draw Calls

| Metric | Value |
|---|---|
| Target | < 250 |
| Maximum | 500 |

---

## Asset Loading

| Operation | Budget |
|---|---|
| Startup | < 3 s |
| Scene Transition | < 2 s |
| Streaming | < 50 ms |

---

## Validation

- Profile every milestone
- Track regressions
- Block releases exceeding budget
