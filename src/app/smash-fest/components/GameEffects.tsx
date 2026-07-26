"use client";

import { createContext, memo, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Impact feel: debris, camera shake and hitstop.
 *
 * All three are deliberately non-physical. Debris are pool-allocated instances
 * integrated by hand rather than rigid bodies — a demolition throws hundreds of
 * chips and adding them to the solver would tank the frame rate for something
 * the player only ever sees for half a second.
 */

/* eslint-disable react-hooks/immutability --
   Every frame here mutates preallocated buffers and three.js objects in place;
   that is the whole point. These rules model plain React data, not r3f. */

const MAX_DEBRIS = 96;
const DEBRIS_GRAVITY = 14;
const SHAKE_DECAY = 5.5;
const MAX_SHAKE = 0.32;

export type EffectsApi = {
  /** Debris + shake at a world position. `strength` is roughly 0..1. */
  impact: (x: number, y: number, z: number, color: string, strength: number) => void;
  shake: (amount: number) => void;
  /** Freeze the world, then run it slowly — used for the winning blow. */
  hitstop: (freezeMs: number, slowMs: number) => void;
};

const EffectsContext = createContext<EffectsApi | null>(null);

export function useEffects() {
  return useContext(EffectsContext);
}

// Impacts arrive in bursts of dozens per frame during a collapse; without this
// the debris pool is consumed by a single frame's worth of contacts.
const BURST_THROTTLE_MS = 45;

export const EffectsRig = memo(function EffectsRig({
  children,
  onHitstop,
}: {
  children: ReactNode;
  onHitstop?: (freezeMs: number, slowMs: number) => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Parallel arrays over the instance pool. `life` <= 0 means the slot is free.
  const pool = useMemo(
    () => ({
      pos: new Float32Array(MAX_DEBRIS * 3),
      vel: new Float32Array(MAX_DEBRIS * 3),
      spin: new Float32Array(MAX_DEBRIS * 3),
      rot: new Float32Array(MAX_DEBRIS * 3),
      life: new Float32Array(MAX_DEBRIS),
      maxLife: new Float32Array(MAX_DEBRIS),
      size: new Float32Array(MAX_DEBRIS),
      cursor: 0,
      lastBurstAt: 0,
    }),
    []
  );

  const shake = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);
  const shakeOffset = useMemo(() => new THREE.Vector3(), []);

  // InstancedMesh only allocates its colour attribute once setColorAt is used.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < MAX_DEBRIS; i++) mesh.setColorAt(i, tint.set("#ffffff"));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tint]);

  const api = useMemo<EffectsApi>(
    () => ({
      shake(amount) {
        shake.current = Math.min(MAX_SHAKE, shake.current + amount);
      },

      impact(x, y, z, color, strength) {
        const now = performance.now();
        const s = Math.max(0, Math.min(1, strength));

        shake.current = Math.min(MAX_SHAKE, shake.current + s * 0.16);

        if (now - pool.lastBurstAt < BURST_THROTTLE_MS) return;
        pool.lastBurstAt = now;

        const mesh = meshRef.current;
        if (!mesh) return;

        tint.set(color);
        const count = 3 + Math.round(s * 7);

        for (let n = 0; n < count; n++) {
          const i = pool.cursor;
          pool.cursor = (pool.cursor + 1) % MAX_DEBRIS;
          const i3 = i * 3;

          pool.pos[i3] = x;
          pool.pos[i3 + 1] = y;
          pool.pos[i3 + 2] = z;

          // Upward-biased hemisphere so chips spray away from the surface.
          const theta = Math.random() * Math.PI * 2;
          const speed = (1.6 + Math.random() * 3.4) * (0.5 + s);
          const up = 0.4 + Math.random() * 0.9;
          const flat = Math.sqrt(Math.max(0, 1 - up * up * 0.5));
          pool.vel[i3] = Math.cos(theta) * flat * speed;
          pool.vel[i3 + 1] = up * speed;
          pool.vel[i3 + 2] = Math.sin(theta) * flat * speed;

          pool.spin[i3] = (Math.random() - 0.5) * 12;
          pool.spin[i3 + 1] = (Math.random() - 0.5) * 12;
          pool.spin[i3 + 2] = (Math.random() - 0.5) * 12;
          pool.rot[i3] = Math.random() * Math.PI;
          pool.rot[i3 + 1] = Math.random() * Math.PI;
          pool.rot[i3 + 2] = Math.random() * Math.PI;

          const life = 0.55 + Math.random() * 0.6;
          pool.life[i] = life;
          pool.maxLife[i] = life;
          pool.size[i] = 0.5 + Math.random() * 0.9;

          mesh.setColorAt(i, tint);
        }

        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      },

      hitstop(freezeMs, slowMs) {
        onHitstop?.(freezeMs, slowMs);
      },
    }),
    [pool, tint, onHitstop]
  );

  // Runs at the default priority, which is *after* drei's OrbitControls (-1).
  // The controls recompute camera.position from their spherical state every
  // frame, so this offset never accumulates — it just survives until the render.
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const mesh = meshRef.current;

    if (mesh) {
      let alive = 0;
      for (let i = 0; i < MAX_DEBRIS; i++) {
        if (pool.life[i] <= 0) {
          dummy.position.set(0, -1000, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }

        alive++;
        const i3 = i * 3;
        pool.life[i] -= delta;

        pool.vel[i3 + 1] -= DEBRIS_GRAVITY * delta;
        pool.pos[i3] += pool.vel[i3] * delta;
        pool.pos[i3 + 1] += pool.vel[i3 + 1] * delta;
        pool.pos[i3 + 2] += pool.vel[i3 + 2] * delta;

        // Cheap floor bounce so chips settle instead of sinking out of view.
        if (pool.pos[i3 + 1] < 0.05 && pool.vel[i3 + 1] < 0) {
          pool.pos[i3 + 1] = 0.05;
          pool.vel[i3 + 1] *= -0.32;
          pool.vel[i3] *= 0.6;
          pool.vel[i3 + 2] *= 0.6;
        }

        pool.rot[i3] += pool.spin[i3] * delta;
        pool.rot[i3 + 1] += pool.spin[i3 + 1] * delta;
        pool.rot[i3 + 2] += pool.spin[i3 + 2] * delta;

        const fade = Math.max(0, pool.life[i] / pool.maxLife[i]);
        dummy.position.set(pool.pos[i3], pool.pos[i3 + 1], pool.pos[i3 + 2]);
        dummy.rotation.set(pool.rot[i3], pool.rot[i3 + 1], pool.rot[i3 + 2]);
        dummy.scale.setScalar(pool.size[i] * (0.35 + fade * 0.65));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = alive > 0;
    }

    if (shake.current > 0.0005) {
      shake.current *= Math.exp(-SHAKE_DECAY * delta);
      const a = shake.current;
      shakeOffset.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a * 0.5);
      camera.position.add(shakeOffset);
    } else {
      shake.current = 0;
    }
  });

  return (
    <EffectsContext.Provider value={api}>
      {children}
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_DEBRIS]} frustumCulled={false} castShadow>
        <boxGeometry args={[0.17, 0.17, 0.17]} />
        <meshStandardMaterial roughness={0.75} metalness={0.1} />
      </instancedMesh>
    </EffectsContext.Provider>
  );
});
/* eslint-enable react-hooks/immutability */
