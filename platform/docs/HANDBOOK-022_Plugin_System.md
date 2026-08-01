# HANDBOOK-022 — Plugin System

## Purpose

Define engine extensibility.

---

## Plugin Types

Support:

```text
Runtime

Editor

Tool

Importer
```

---

## Plugin Lifecycle

```text
Discover

↓

Load

↓

Initialize

↓

Run

↓

Shutdown

↓

Unload
```

---

## Capabilities

Plugins MAY register:

* Modules
* Systems
* Importers
* Commands
* Panels

---

## Restrictions

Plugins SHALL NOT modify Engine internals.

Communication SHALL occur through public APIs.

---

## Acceptance Criteria

* Dynamic loading.
* Stable interfaces.
* Safe unloading.
