# Global Rule — Camera / Renderer Separation

## Purpose

The Camera System SHALL produce view information only.

The Renderer SHALL consume view information only.

Neither subsystem SHALL depend on the implementation of the other.

---

## Camera Output

Every camera SHALL produce a `CameraView`.

Minimum contents:

```cpp
Transform

Projection

Viewport

Near Plane

Far Plane

Visibility Mask
```

---

## Renderer Input

The Renderer SHALL consume one or more `CameraView` objects.

The Renderer SHALL NOT query Camera components directly.

---

## Benefits

This architecture SHALL support:

* Gameplay Camera
* Editor Camera
* Debug Camera
* Replay Camera
* Cinematic Camera
* Minimap Camera
* Split Screen
* Multiple simultaneous cameras

without modifying the Renderer.
