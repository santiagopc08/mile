# RFC-003 — Execution Pipeline

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates: PS-005 Execution Model  

---

## 1. Abstract

This RFC defines the normative execution pipeline of a Runtime Instance.

The Execution Pipeline specifies the ordered sequence of stages executed
during every simulation cycle.

Its purpose is to guarantee deterministic execution while allowing
implementations to optimize scheduling and parallelism without changing
observable behavior.

This document is normative.

---

## 2. Motivation

A Runtime executes simulation through a sequence of well-defined stages.

Every implementation SHALL execute the same logical pipeline, even if
its internal implementation differs.

---

## 3. Terminology

The key words MUST, MUST NOT, SHALL, SHOULD and MAY are interpreted as
defined by RFC 2119.
