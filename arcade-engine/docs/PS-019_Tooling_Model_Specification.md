# PS-019 — Tooling Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Purpose

This specification defines the Tooling Model of ORBIT Arcade Platform.

Tooling provides standardized access to platform metadata,
reflection and diagnostics.

---

## 2. Design Goals

Tooling SHALL:

- consume platform metadata;
- remain implementation-independent;
- support automation;
- support documentation;
- support validation.

---

## 3. Tool Categories

The platform SHALL support:

- CLI
- Editor
- Inspector
- Profiler
- Validator
- Documentation Generator
- Code Generator
- Package Manager

---

## 4. Reflection

All Tooling SHALL consume Reflection APIs.

Reflection SHALL expose:

- Identities
- Schemas
- Contracts
- Resources
- Assets
- Plugins
- Modules

---

## 5. Metadata

Tooling SHALL consume Metadata only.

Tooling SHALL NOT require Runtime internals.

---

## 6. Diagnostics

The Runtime SHALL expose standardized diagnostics.

Diagnostics SHALL be machine-readable.

---

## 7. Automation

Tooling MAY automate:

- validation;
- documentation;
- package generation;
- code generation;
- testing.

---

## 8. Registry Access

Tooling SHALL access platform registries through public APIs.

---

## 9. Version Compatibility

Tooling SHALL validate platform versions before execution.

---

## 10. Lifecycle

```text
Discover
  ↓
Inspect
  ↓
Analyze
  ↓
Generate
  ↓
Validate
  ↓
Report
```

---

## 11. Invariants

- Tooling consumes metadata.
- Tooling never mutates Runtime state.
- Reflection is authoritative.

---

## 12. Conformance

An implementation conforms if it:

- exposes Reflection;
- exposes Metadata;
- provides standardized Diagnostics;
- supports automation.
