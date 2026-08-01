# HANDBOOK-013 — Audio Architecture

## Purpose

Define the Runtime Audio subsystem.

---

## Responsibilities

Audio SHALL own:

* Playback
* Mixing
* Audio Routing
* Spatial Audio
* Music

Audio SHALL NOT own gameplay logic.

---

## Audio Flow

```text
Gameplay Event

↓

Audio Event

↓

Audio Source

↓

Audio Bus

↓

Master

↓

Output Device
```

---

## Audio Sources

Support:

```text
Music

Sound Effect

Ambient

UI
```

---

## Audio Buses

Default buses:

```text
Master

Music

SFX

UI

Ambient
```

---

## Listener

The active Camera SHALL own the Audio Listener.

---

## Playback

Support:

```text
Play

Pause

Resume

Stop

Loop
```

---

## Asset Usage

Audio SHALL consume Asset Handles only.

---

## Acceptance Criteria

* Event-driven playback.
* Hierarchical mixing.
* Backend-independent.
