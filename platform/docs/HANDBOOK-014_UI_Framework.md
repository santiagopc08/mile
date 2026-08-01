# HANDBOOK-014 — UI Framework

## Purpose

Define the Runtime UI architecture.

---

## Responsibilities

UI SHALL own:

* Widget Tree
* Layout
* Styling
* Rendering
* Input Routing

UI SHALL NOT own gameplay.

---

## Widget Hierarchy

```text
Canvas

↓

Container

↓

Widgets
```

---

## Widget Types

Support:

```text
Panel

Image

Label

Button

ProgressBar

Container
```

---

## Layout

Support:

```text
Absolute

Vertical

Horizontal

Anchor
```

---

## Themes

Themes SHALL define:

* Colors
* Fonts
* Spacing
* Icons

---

## UI Flow

```text
Runtime State

↓

ViewModel

↓

Widgets

↓

Layout

↓

Renderer
```

Widgets SHALL NOT access gameplay directly.

---

## Acceptance Criteria

* Hierarchical widgets.
* Deterministic layout.
* Runtime isolation.
