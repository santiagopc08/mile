# RFC-002 — Capability Registry & Resolution

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates: PS-003 Capability Model  

---

## 1. Abstract

This RFC defines the discovery, registration, dependency resolution,
validation and instantiation of Capabilities.

It specifies how Runtime Instances compose applications from
Capability descriptors.

This document is normative.

---

## 2. Motivation

Capabilities are the primary composition mechanism of ORBIT Arcade Platform.

To guarantee deterministic composition, all Runtime Instances SHALL
resolve Capabilities using the process defined in this specification.

---

## 3. Terminology

The key words MUST, MUST NOT, SHALL, SHOULD and MAY are interpreted as
described in RFC 2119.

---

## 4. Capability Registry

A Capability Registry is the authoritative catalog of all Capabilities
available to a Runtime Instance.

The Registry SHALL:

- register Capabilities;
- expose Capability descriptors;
- resolve identifiers;
- validate uniqueness;
- resolve versions;
- provide dependency information.

The Registry SHALL NOT instantiate Capabilities.
