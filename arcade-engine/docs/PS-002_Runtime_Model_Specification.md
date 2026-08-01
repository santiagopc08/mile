# PS-002 — Runtime Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the Runtime model of ORBIT Arcade Platform.

The Runtime is the execution environment responsible for composing, coordinating and executing platform capabilities.

The Runtime is the only architectural component allowed to control application execution.

---

## 2. Scope

This specification defines:

- Runtime responsibilities
- Runtime ownership
- Runtime lifecycle
- Runtime composition
- Runtime execution boundaries

This specification does not define:

- scheduling algorithms
- threading
- ECS
- physics
- rendering

Those subjects belong to dedicated RFCs.

---

## 3. Runtime Definition

The Runtime is the execution authority of an application.

Every application executes inside exactly one Runtime instance.

The Runtime owns:

- execution
- orchestration
- scheduling
- lifecycle
- domains
- capability composition

Applications never own execution.

Capabilities never own execution.

Only the Runtime owns execution.

---

## 4. Runtime Responsibilities

The Runtime shall:

- initialize the platform
- compose capabilities
- initialize domains
- execute systems
- dispatch events
- execute commands
- manage transactions
- coordinate shutdown

The Runtime shall not:

- implement gameplay
- implement rendering
- implement navigation
- implement persistence

Those responsibilities belong to capabilities.
