# RFC-014 — Plugin System

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- RFC-001 Runtime Lifecycle
- RFC-002 Capability Registry
- RFC-012 Capability Contracts

---

## 1. Abstract

This RFC defines the Plugin System of ORBIT Arcade Platform.

Plugins package one or more Capabilities together with metadata,
contracts and resources.

The Plugin System enables modular composition, dynamic discovery,
version management and extensibility while preserving deterministic
Runtime behavior.

This document is normative.

---

## 2. Motivation

Applications should be composed from reusable modules rather than
statically linked implementations.

Plugins provide the deployment unit of ORBIT.

---

## 3. Terminology

The key words SHALL, SHALL NOT, MUST, MUST NOT, SHOULD and MAY
are interpreted according to RFC 2119.

---

## 4. Plugin Definition

A Plugin is a deployable package.

A Plugin MAY contain:

- Capabilities;
- Contracts;
- Schemas;
- Assets;
- Resources;
- Configuration;
- Documentation;
- Migrations.

A Plugin SHALL expose exactly one Plugin Manifest.

---

## 5. Plugin Model

```text
Plugin
  ↓
Manifest
  ↓
Capabilities
  ↓
Contracts
  ↓
Schemas
  ↓
Assets
  ↓
Resources
```

---

## 6. Plugin Manifest

Example:

```yaml
plugin:
  id: orbit.physics
  version: 2.0.0
  author: ORBIT Foundation
  license: Apache-2.0

capabilities:
  - Physics

contracts:
  - PhysicsContract

dependencies:
  - orbit.math >=2.0
```

---

## 7. Plugin Identity

Every Plugin SHALL define:

- PluginId
- Version
- Publisher
- Display Name

Plugin IDs SHALL be globally unique.

---

## 8. Discovery

The Runtime SHALL discover Plugins before Composition.

Discovery MAY occur from:

- local filesystem;
- package registry;
- embedded bundles;
- application manifests.

Discovery SHALL NOT instantiate Plugins.

---

## 9. Loading

Loading SHALL perform:

- manifest validation;
- schema validation;
- dependency validation;
- contract validation;
- compatibility validation.

Only validated Plugins MAY be loaded.

---

## 10. Dependency Resolution

Plugins MAY depend on other Plugins.

Dependency resolution SHALL:

- validate versions;
- detect cycles;
- detect missing plugins;
- detect conflicts.

---

## 11. Isolation

Plugins SHALL be isolated.

Isolation includes:

- resources;
- configuration;
- diagnostics;
- contracts;
- namespaces.

---

## 12. Resources

Plugins MAY register:

- textures;
- audio;
- fonts;
- localization;
- configuration;
- shaders;
- editor resources.

Resources SHALL NOT modify Runtime behavior directly.

---

## 13. Activation

```text
Registered
  ↓
Loaded
  ↓
Validated
  ↓
Activated
  ↓
Running
  ↓
Deactivated
  ↓
Unloaded
  ↓
Disposed
```

---

## 14. Dynamic Loading

The Runtime MAY support runtime loading.

Dynamic loading SHALL preserve Runtime consistency.

The Runtime SHALL reject loading that would violate dependency or
contract constraints.

---

## 15. Updates

Plugin updates SHALL validate:

- manifest;
- contracts;
- schemas;
- compatibility;
- migrations.

Updates SHALL NOT invalidate an active Runtime Instance.

---

## 16. Diagnostics

The Runtime SHALL expose:

- installed plugins;
- loaded plugins;
- activation failures;
- dependency graph;
- version conflicts;
- load time.

---

## 17. Failure Handling

```text
Invalid Manifest     →  Reject Plugin
Missing Dependency   →  Reject Plugin
Contract Violation   →  Reject Plugin
Schema Failure       →  Reject Plugin
```

---

## 18. Invariants

- Every Plugin has exactly one Manifest.
- Plugins are isolated.
- Plugin identifiers are globally unique.
- Plugins never bypass Capability Contracts.
- Plugins never modify Runtime architecture.

---

## 19. Conformance

An implementation conforms if it:

- validates Plugins;
- enforces dependency rules;
- preserves isolation;
- validates manifests;
- maintains all invariants.
