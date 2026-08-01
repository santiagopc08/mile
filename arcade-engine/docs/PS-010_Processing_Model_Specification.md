# PS-010 — Processing Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the Processing Model of ORBIT Arcade Platform.

Processing is the execution of behavior over simulation data.

Processing transforms state.

Processing never owns state.

State remains owned by the Data Model.

---

## 2. Scope

This specification defines:

- processing units
- Systems
- Queries
- execution ownership
- processing boundaries
- processing ordering

This specification does not define:

- scheduling
- threading
- ECS storage
- rendering
- physics algorithms

Those subjects belong to dedicated specifications.

---

## 3. Design Goals

The Processing Model shall:

- remain deterministic;
- remain composable;
- remain stateless whenever possible;
- maximize parallel execution;
- minimize coupling;
- support observability.
