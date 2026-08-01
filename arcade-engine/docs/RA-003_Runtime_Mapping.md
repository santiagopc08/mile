# RA-003 — Runtime Mapping

Version: 1.0 (Draft)  
Status: Draft  
Category: Reference Application

---

## Purpose

This document maps gameplay features to Runtime subsystems.

---

## Feature Flows

### Accelerator

```text
Input → Command → Processing → Transaction → Projection → Renderer
```

### Brake

```text
Input → Physics → Projection → Rendering
```

### Coin Pickup

```text
Collision → Transaction → Event → HUD Update → Audio
```

### Fuel Pickup

```text
Collision → Transaction → Projection → HUD
```

### Crash

```text
Physics → Transaction → Event → Restart UI
```

### Pause

```text
Input → Scheduler → UI
```

### Save

```text
Transaction → Persistence
```

---

## Coverage Matrix

| Feature  | Runtime Subsystem |
|---|---|
| Driving  | Physics           |
| Camera   | Projection        |
| Coins    | Events            |
| Fuel     | Queries           |
| Terrain  | Assets            |
| HUD      | Projection        |
| Audio    | Events            |
| Save     | Transactions      |
| Pause    | Scheduler         |
