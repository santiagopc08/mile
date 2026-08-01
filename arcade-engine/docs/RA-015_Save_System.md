# RA-015 — Save System

Version: 1.0 (Draft)  
Status: Draft  
Category: Persistence

---

## Purpose

Persist player progress.

Saving SHALL occur outside gameplay processing.

---

## Saved Data

- Best Distance
- Coins
- Settings
- Audio Levels
- Control Bindings
- Achievements (Future)

---

## Save Triggers

- Application Exit
- Checkpoint
- Settings Change
- Manual Save

---

## Load Sequence

```text
Application Start
  ↓
Load Save
  ↓
Validate
  ↓
Create Runtime State
  ↓
Continue
```

---

## Save Format

- Implementation Independent
- Versioned
- Checksummed

---

## Failure Handling

```text
Invalid Save
  ↓
Backup Recovery
  ↓
Default Save
```

---

## Validation

- No corrupted saves
- Backward compatibility
- Automatic recovery
- Version migration
