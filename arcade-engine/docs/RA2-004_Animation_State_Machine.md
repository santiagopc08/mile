# RA2-004 — Animation State Machine

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Animation Graph

```text
Idle
  ↓
Walk
  ↓
Run
  ↓
Jump
  ↓
Fall
  ↓
Landing
  ↓
Idle
```

---

## Combat

```text
Attack
  ↓
Recover
  ↓
Idle
```

---

## Damage

```text
Hurt
  ↓
Invulnerable
  ↓
Idle
```

---

## Parameters

- Speed
- Grounded
- Attack
- Health
- Direction

---

## Validation

- No invalid transitions
- Smooth blending
- Consistent timing
