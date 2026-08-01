# PS-003 — Capability Model

Version: 1.0 (Draft)  
Status: Draft  
Category: Platform Specification  

---

## 1. Introduction

This specification defines the Capability Model of ORBIT Arcade Platform.

Capabilities are the fundamental building blocks of the platform.

Every platform feature is expressed as a Capability.

Applications are composed by selecting Capabilities.

The Runtime composes Capabilities into executable Domains.

---

## 2. Scope

This specification defines:

- Capability definition
- Capability lifecycle
- Capability composition
- Capability dependencies
- Capability contracts

This specification does not define:

- plugins
- package formats
- APIs
- manifests

Those subjects belong to dedicated specifications.

---

## 3. Capability Definition

A Capability is an isolated unit of functionality exposing one or more public contracts.

Capabilities own behavior.

Capabilities never own execution.

Capabilities execute only through the Runtime.

Capabilities may depend on other Capabilities.

Capabilities never depend on Applications.

---

## 4. Responsibilities

Capabilities shall:

- expose contracts
- register services
- register systems
- declare dependencies
- expose configuration
- expose diagnostics

Capabilities shall not:

- schedule themselves
- own application lifecycle
- directly access unrelated capabilities
