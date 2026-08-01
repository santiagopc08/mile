# PS-004 — Domain Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the Domain Model of ORBIT Arcade Platform.

Domains are execution partitions within a Runtime Instance.

Domains group Capabilities that share the same execution semantics.

Domains define execution boundaries.

Domains do not define functionality.

Capabilities define functionality.

---

## 2. Scope

This specification defines:

- Domain definition
- Domain responsibilities
- Domain lifecycle
- Domain ownership
- Domain composition

This specification does not define:

- scheduling
- threading
- ECS
- gameplay
- physics

Those subjects belong to dedicated specifications.

---

## 3. Domain Definition

A Domain is an isolated execution context.

Domains execute one or more Capabilities.

Domains provide execution semantics.

Domains own Worlds.

Domains never own Applications.

Domains never own Runtime lifecycle.

---

## 4. Responsibilities

Domains shall:

- execute systems
- own Worlds
- coordinate local services
- expose diagnostics
- expose metrics

Domains shall not:

- resolve dependencies
- compose capabilities
- manage plugins
- own scheduling policies outside their scope
