# RFC-010 — Entity Graph & Relationships

Version: 1.0 (Draft)  
Status: Draft  
Category: Standards Track  
Updates:
- PS-007 Entity Model
- PS-009 Data Model
- RFC-005 World Transactions

---

## 1. Abstract

This RFC defines the Entity Graph used by ORBIT Arcade Platform.

Entities form a directed graph through explicit Relationships.

Relationships define structural connections between Entities without
transferring ownership.

The Entity Graph provides deterministic traversal while preserving
independent entity lifecycles.

This document is normative.

---

## 2. Motivation

Entities rarely exist in isolation.

Characters own inventories.

Weapons attach to hands.

UI elements reference gameplay objects.

Triggers activate doors.

These interactions require explicit relationships that remain independent
from Component data.

---

## 3. Terminology

The key words SHALL, SHALL NOT, MUST, MUST NOT, SHOULD and MAY
are interpreted according to RFC 2119.

---

## 4. Entity Graph

A World contains an Entity Graph.

The Entity Graph SHALL contain:

- Entities
- Relationships
- Relationship Metadata

Entities SHALL NOT contain other Entities.

Containment SHALL be expressed through Relationships.

---

## 5. Relationship Definition

A Relationship connects two Entities.

Relationships SHALL:

- have a source;
- have a target;
- have a type;
- have an identifier.

Relationships SHALL NOT own either Entity.

---

## 6. Relationship Descriptor

Example:

```yaml
relationship:
  id: rel.weapon
  type: Attachment
  source: Player
  target: Sword
  metadata:
    socket: RightHand
```

---

## 7. Relationship Categories

The Runtime SHALL support:

- Parent
- Child
- Owner
- Reference
- Follower
- Target
- Dependency
- Attachment

Implementations MAY define additional categories.

---

## 8. Ownership Rules

Ownership SHALL NOT be inferred from Relationships.

Destroying an Entity SHALL NOT automatically destroy related Entities
unless explicitly specified by policy.

---

## 9. Cardinality

Relationships MAY define:

- One-to-One
- One-to-Many
- Many-to-One
- Many-to-Many

Cardinality SHALL be validated during Transaction Commit.

---

## 10. Traversal

The Runtime SHALL support deterministic traversal.

Traversal MAY be:

- Depth First
- Breadth First
- Direct Lookup
- Indexed Lookup

Traversal order SHALL remain deterministic.

---

## 11. Cycles

Relationship cycles MAY exist.

Capabilities MAY prohibit specific cycle categories.

The Runtime SHALL detect invalid cycles when declared by policy.

---

## 12. Lifetime

Relationships have an independent lifecycle.

```text
Created
  ↓
Active
  ↓
Updated
  ↓
Removed
```

Destroying an Entity SHALL remove all attached Relationships.

---

## 13. Queries

Queries SHALL access Relationships through the Query Model.

Traversal SHALL NOT expose storage implementation.

---

## 14. Validation

Validation SHALL verify:

- source exists;
- target exists;
- relationship type;
- cardinality;
- policies;
- cycles (if applicable).

---

## 15. Diagnostics

The Runtime SHALL expose:

- relationship count;
- traversal time;
- graph depth;
- graph width;
- cycle detection metrics.

---

## 16. Failure Handling

```text
Invalid Relationship →  Reject Transaction
Missing Entity       →  Reject Relationship
Cycle Violation      →  Reject Transaction
```

---

## 17. Invariants

- Every Relationship has exactly one source.
- Every Relationship has exactly one target.
- Relationships never own Entities.
- Traversal is deterministic.
- Graph integrity is preserved.

---

## 18. Conformance

An implementation conforms if it:

- represents Relationships as graph edges;
- validates graph integrity;
- supports deterministic traversal;
- maintains all invariants.
