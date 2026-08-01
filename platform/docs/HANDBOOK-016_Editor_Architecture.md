# HANDBOOK-016 — Editor Architecture

## Purpose

Define the Editor as a Runtime client.

---

## Responsibilities

Editor SHALL own:

* Panels
* Workspace
* Inspector
* Scene Authoring
* Asset Authoring

Editor SHALL NOT implement engine logic.

---

## Architecture

```text
Editor

↓

Runtime APIs

↓

Engine

↓

Platform
```

---

## Panels

Support:

```text
Hierarchy

Inspector

Project

Console

Profiler

Scene
```

---

## Selection

Support:

```text
Entity

Asset

Component

Folder
```

---

## Commands

Support:

```text
Undo

Redo

Copy

Paste

Duplicate

Delete
```

---

## Editor State

Workspace SHALL persist:

* Layout
* Open Panels
* Selection
* Preferences

---

## Acceptance Criteria

* Runtime client only.
* Persistent workspace.
* No duplicated engine logic.
