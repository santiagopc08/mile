"use client";

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, useBox, useCylinder, usePlane, useSphere } from "@react-three/cannon";
import type { BodyProps, CollideEvent, PublicApi } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabaseClient";
import { EffectsRig, useEffects, type EffectsApi } from "./GameEffects";
import { DEFAULT_LEVELS, normalizeLevel, type LevelNode, type LevelSchema } from "../lib/levels";
import { getRandomMemory, type MemoryItem } from "../lib/memories";

// Re-exported so existing importers keep working after the data moved out.
export { DEFAULT_LEVELS, normalizeLevel, type LevelNode, type LevelSchema };

export type WildcardType = "standard" | "bomb" | "triple" | "heavy";

export type WildcardAmmo = Record<WildcardType, number>;

/** Charges granted at the start of every attempt. Standard shots are free. */
export const INITIAL_WILDCARD_AMMO: WildcardAmmo = {
  standard: Infinity,
  bomb: 2,
  triple: 2,
  heavy: 1,
};

/** Reported when a level is cleared, so the caller can award stars. */
export interface LevelResult {
  shotsUsed: number;
  projectileLimit: number;
}

interface SmashFestGameProps {
  levelId: string;
  activeWildcard: WildcardType;
  shotPower: number; // Multiplier 0.6 - 1.4
  resetKey?: number;
  /** A generated (or otherwise ad-hoc) level, used instead of `levelId`. */
  levelOverride?: LevelSchema | null;
  onMemoryBlockTriggered: (memory?: MemoryItem) => void;
  onComboTriggered?: (comboCount: number) => void;
  onWildcardAmmoUpdate?: (ammo: WildcardAmmo) => void;
  onLevelCompleted?: (result: LevelResult) => void;
  onOutOfAmmo?: () => void;
  onStatsUpdate?: (stats: { remainingBalls: number; memoryBlocksLeft: number; totalMemoryBlocks: number }) => void;
  isSoundMuted?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics tuning                                                             */
/* -------------------------------------------------------------------------- */

// Masses live on a ~1-50 scale: cannon's solver is far more stable when the
// heaviest body is only ~20x the lightest one, and contact stiffness defaults
// assume this order of magnitude.
const BASE_SHOT_SPEED = 24;
const MAX_SHOT_SPEED = 34; // Above this a projectile can tunnel through thin slabs
const PHYSICS_STEP = 1 / 144; // Small enough that no projectile moves further than its radius per step
// Far enough in front of the camera that a launched ball doesn't fill the
// screen and hide the structure during its first few frames.
const MUZZLE_OFFSET = 3.2;
const GRAVITY = 9.81;
const SHOT_COOLDOWN_MS = 220;

// Lifetimes are counted in simulated seconds, not wall-clock time.
const PROJECTILE_TTL_S = 9;
const PROJECTILE_REST_S = 1.3;
const PROJECTILE_KILL_Y = -8;
const MAX_LIVE_PROJECTILES = 6;

const MEMORY_FALL_DROP = 1.2; // Vertical drop from origin that counts as "liberated"
const MEMORY_FALL_SPREAD = 1.8; // ...or a big enough horizontal displacement

const BOMB_RADIUS = 4.6;
const BOMB_POWER = 16;
const BOMB_LIFT = 0.45;

const ARC_STEPS = 34;

/**
 * Where the player is aiming, in normalised device coordinates.
 *
 * A mouse aims by hovering, but a touch screen has no hover: r3f's shared
 * `pointer` stays wherever the last touch left it, so on a phone the arc used
 * to preview a shot the player was not taking. The controller writes this while
 * a finger is down and the guide follows it, which turns a tap into
 * press-to-aim, release-to-fire.
 */
export type AimSource = { ndc: THREE.Vector2; visible: boolean };

export function createAimSource(): AimSource {
  return { ndc: new THREE.Vector2(0, 0), visible: true };
}

const WILDCARD_SPECS: Record<
  WildcardType,
  { mass: number; radius: number; color: string | null; speedScale: number; restitution: number }
> = {
  standard: { mass: 3.2, radius: 0.34, color: null, speedScale: 1, restitution: 0.26 },
  bomb: { mass: 3.0, radius: 0.42, color: "#ff003c", speedScale: 0.95, restitution: 0.08 },
  triple: { mass: 1.9, radius: 0.3, color: "#c3f400", speedScale: 1.05, restitution: 0.3 },
  heavy: { mass: 14, radius: 0.55, color: "#a178ff", speedScale: 0.82, restitution: 0.04 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function shotSpeedFor(wildcard: WildcardType, power: number) {
  return Math.min(MAX_SHOT_SPEED, BASE_SHOT_SPEED * power * WILDCARD_SPECS[wildcard].speedScale);
}

/* -------------------------------------------------------------------------- */
/* Audio                                                                      */
/* -------------------------------------------------------------------------- */

type SoundName = "shoot" | "hit" | "thud" | "clang" | "bomb" | "heavy" | "memory" | "victory";

// A single shared AudioContext for the whole page. Creating one per sound (as
// this used to) exhausts the browser's hard limit of ~6 contexts within seconds
// of the first collision burst and leaks every one of them.
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let audioMuted = false;
const lastPlayedAt: Partial<Record<SoundName, number>> = {};

// Minimum gap between two plays of the same sound. Collisions arrive in bursts
// of dozens per frame; without this the mix turns into white noise.
const SOUND_THROTTLE_MS: Record<SoundName, number> = {
  shoot: 60,
  hit: 55,
  thud: 70,
  clang: 70,
  bomb: 180,
  heavy: 180,
  memory: 220,
  victory: 0,
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.85;
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  audioMuted = muted;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, audioCtx.currentTime, 0.02);
  }
}

function blip(ctx: AudioContext, out: GainNode, wave: OscillatorType, from: number, to: number, dur: number, vol: number, delay = 0) {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
  gain.gain.setValueAtTime(Math.max(0.001, vol), start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + dur);
  // Oscillator nodes disconnect themselves once stopped; the graph stays flat.
  osc.onended = () => gain.disconnect();
}

// `intensity` is normally derived from the contact impact velocity so a graze
// sounds different from a demolition.
function playSound(name: SoundName, intensity = 1) {
  if (audioMuted) return;
  const gap = SOUND_THROTTLE_MS[name];
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (gap > 0 && now - (lastPlayedAt[name] ?? -Infinity) < gap) return;

  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  lastPlayedAt[name] = now;

  const v = clamp(intensity, 0.12, 1);

  switch (name) {
    case "shoot":
      blip(ctx, masterGain, "sawtooth", 360, 70, 0.16, 0.16);
      break;
    case "hit":
      blip(ctx, masterGain, "triangle", 180, 40, 0.1, 0.2 * v);
      break;
    case "thud":
      blip(ctx, masterGain, "sine", 120, 34, 0.13, 0.22 * v);
      break;
    case "clang":
      blip(ctx, masterGain, "square", 520, 180, 0.09, 0.12 * v);
      blip(ctx, masterGain, "triangle", 160, 50, 0.14, 0.16 * v);
      break;
    case "bomb":
      blip(ctx, masterGain, "square", 130, 20, 0.36, 0.34);
      blip(ctx, masterGain, "sawtooth", 60, 18, 0.42, 0.24);
      break;
    case "heavy":
      blip(ctx, masterGain, "sawtooth", 95, 25, 0.3, 0.32 * v);
      break;
    case "memory":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(ctx, masterGain!, "sine", f, f, 0.3, 0.15, i * 0.07));
      break;
    case "victory":
      [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => blip(ctx, masterGain!, "triangle", f, f, 0.45, 0.18, i * 0.11));
      break;
  }
}

/* -------------------------------------------------------------------------- */
/* Body registry                                                              */
/* -------------------------------------------------------------------------- */

type BodyEntry = {
  kind: "node" | "projectile";
  obj: THREE.Object3D;
  api: PublicApi;
  mass: number;
  isMemory: boolean;
  /** Debris colour, so a shattered block sprays its own material. */
  tint: string;
  origin: THREE.Vector3;
  // Projectile bookkeeping, in simulated seconds
  age: number;
  lastPos: THREE.Vector3;
  restFor: number;
  expired: boolean;
};

type Registry = { current: Map<string, BodyEntry> };

const RegistryContext = createContext<Registry | null>(null);

// @react-three/cannon assigns `object.position` exactly once, when the body is
// created, and from then on only writes `object.matrix` (with matrixAutoUpdate
// turned off). `object.position` therefore reports the spawn point forever —
// anything that needs a live position has to decompose the matrix. Bodies are
// always mounted under identity-transform groups, so this is world space.
function bodyPosition(obj: THREE.Object3D, out: THREE.Vector3) {
  return out.setFromMatrixPosition(obj.matrix);
}

function useRegistry() {
  return useContext(RegistryContext);
}

// Radial impulse with linear falloff. cannon turns an impulse into Δv = J / m,
// so scaling J by √m keeps heavy blocks from being immovable while still making
// them react much less than the light ones.
function detonate(registry: Registry, center: THREE.Vector3, selfId: string) {
  const dir = new THREE.Vector3();
  const at = new THREE.Vector3();
  registry.current.forEach((entry, id) => {
    if (id === selfId || entry.mass <= 0) return;
    bodyPosition(entry.obj, at);
    const dist = at.distanceTo(center);
    if (dist > BOMB_RADIUS) return;

    dir.subVectors(at, center);
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    dir.normalize();
    dir.y += BOMB_LIFT;
    dir.normalize();

    const j = BOMB_POWER * (1 - dist / BOMB_RADIUS) * Math.sqrt(entry.mass);
    entry.api.wakeUp();
    entry.api.applyImpulse([dir.x * j, dir.y * j, dir.z * j], [0, 0, 0]);
  });
}

/* -------------------------------------------------------------------------- */
/* Scene primitives                                                           */
/* -------------------------------------------------------------------------- */

const Ground = memo(function Ground({ color }: { color: string }) {
  const [ref] = usePlane<THREE.Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    material: { friction: 0.75, restitution: 0.04 },
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.1} />
    </mesh>
  );
});

const NODE_COLORS: Record<string, string> = {
  metal: "#68788c",
  stone: "#382e39",
  wood: "#6e5a6a",
};

function nodeSound(material: string): SoundName {
  return material === "metal" ? "clang" : material === "stone" ? "thud" : "hit";
}

function nodeColor(node: LevelNode) {
  if (node.isMemoryBlock) return node.type === "cylinder" ? "#c3f400" : "#ff4b89";
  if (node.type === "cylinder") return node.material === "metal" ? "#61728a" : "#4a3c48";
  return NODE_COLORS[node.material] ?? NODE_COLORS.wood;
}

function useNodeRegistration(
  registry: Registry | null,
  node: LevelNode,
  ref: React.RefObject<THREE.Mesh | null>,
  api: PublicApi
) {
  useEffect(() => {
    const map = registry?.current;
    const obj = ref.current;
    if (!map || !obj) return;

    map.set(node.id, {
      kind: "node",
      obj,
      api,
      mass: node.isStatic ? 0 : node.mass,
      isMemory: !!node.isMemoryBlock,
      tint: nodeColor(node),
      origin: new THREE.Vector3(...node.position),
      age: 0,
      lastPos: new THREE.Vector3(...node.position),
      restFor: 0,
      expired: false,
    });

    return () => {
      map.delete(node.id);
    };
  }, [registry, node, ref, api]);
}

// Shared body options. Damping used to be so high (0.35 / 0.45) that structures
// sank into place instead of tumbling; these values keep the tumble while still
// letting bodies settle and fall asleep.
function bodyProps(node: LevelNode, effects: EffectsApi | null): BodyProps {
  return {
    mass: node.isStatic ? 0 : node.mass,
    type: node.isStatic ? "Static" : "Dynamic",
    position: node.position,
    linearDamping: 0.1,
    angularDamping: 0.22,
    allowSleep: true,
    sleepSpeedLimit: 0.2,
    sleepTimeLimit: 0.5,
    material: { friction: node.friction ?? 0.6, restitution: 0.06 },
    onCollide: (e: CollideEvent) => {
      const impact = Math.abs(e.contact?.impactVelocity ?? 0);
      if (impact < 1.8) return;
      playSound(nodeSound(node.material), impact / 10);

      const point = e.contact?.contactPoint;
      if (effects && point) {
        effects.impact(point[0], point[1], point[2], nodeColor(node), impact / 14);
      }
    },
  };
}

const BoxNode = memo(function BoxNode({ node }: { node: LevelNode }) {
  const registry = useRegistry();
  const effects = useEffects();
  const [ref, api] = useBox<THREE.Mesh>(() => ({ ...bodyProps(node, effects), args: node.dimensions }));
  useNodeRegistration(registry, node, ref, api);

  const color = node.isMemoryBlock ? "#ff4b89" : NODE_COLORS[node.material] ?? NODE_COLORS.wood;

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={node.dimensions} />
      <meshStandardMaterial
        color={color}
        emissive={node.isMemoryBlock ? "#ff4b89" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.9 : 0}
        // There is no environment map in this scene, so a near-1 metalness
        // surface has nothing to reflect and renders as a black hole. Keeping
        // metal semi-rough lets its diffuse colour actually show.
        metalness={node.isMemoryBlock ? 0.5 : node.material === "metal" ? 0.45 : 0.2}
        roughness={node.isMemoryBlock ? 0.25 : node.material === "metal" ? 0.4 : 0.6}
      />
    </mesh>
  );
});

const CylinderNode = memo(function CylinderNode({ node }: { node: LevelNode }) {
  const registry = useRegistry();
  const effects = useEffects();
  const args: [number, number, number, number] = [node.dimensions[0], node.dimensions[1], node.dimensions[2], 16];
  const [ref, api] = useCylinder<THREE.Mesh>(() => ({ ...bodyProps(node, effects), args }));
  useNodeRegistration(registry, node, ref, api);

  const color = node.isMemoryBlock ? "#c3f400" : node.material === "metal" ? "#61728a" : "#4a3c48";

  return (
    <mesh ref={ref} castShadow receiveShadow>
      {/* Same segment count as the collider so what you see is what you hit */}
      <cylinderGeometry args={[node.dimensions[0], node.dimensions[1], node.dimensions[2], 16]} />
      <meshStandardMaterial
        color={color}
        emissive={node.isMemoryBlock ? "#c3f400" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.9 : 0}
        // There is no environment map in this scene, so a near-1 metalness
        // surface has nothing to reflect and renders as a black hole. Keeping
        // metal semi-rough lets its diffuse colour actually show.
        metalness={node.isMemoryBlock ? 0.5 : node.material === "metal" ? 0.45 : 0.2}
        roughness={node.isMemoryBlock ? 0.25 : node.material === "metal" ? 0.4 : 0.6}
      />
    </mesh>
  );
});

type ProjectileState = { id: string; pos: [number, number, number]; vel: [number, number, number]; type: WildcardType };

const Projectile = memo(function Projectile({
  id,
  position,
  velocity,
  color,
  type,
  onDetonate,
}: {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  type: WildcardType;
  onDetonate: (id: string, at: [number, number, number]) => void;
}) {
  const registry = useRegistry();
  const effects = useEffects();
  const spec = WILDCARD_SPECS[type];
  const ballColor = spec.color ?? color;
  const detonatedRef = useRef(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const [ref, api] = useSphere<THREE.Mesh>(() => ({
    mass: spec.mass,
    position,
    velocity,
    args: [spec.radius],
    linearDamping: 0.02,
    angularDamping: 0.1,
    allowSleep: true,
    sleepSpeedLimit: 0.25,
    sleepTimeLimit: 0.4,
    material: { friction: 0.4, restitution: spec.restitution },
    onCollide: (e: CollideEvent) => {
      const impact = Math.abs(e.contact?.impactVelocity ?? 0);

      if (type === "bomb" && !detonatedRef.current && impact > 1.0) {
        detonatedRef.current = true;
        const obj = meshRef.current;
        const blast = obj ? bodyPosition(obj, new THREE.Vector3()) : new THREE.Vector3(...position);
        const at: [number, number, number] = [blast.x, blast.y, blast.z];
        if (registry) detonate(registry, blast, id);
        playSound("bomb");
        effects?.impact(at[0], at[1], at[2], "#ff7a3c", 1);
        effects?.shake(0.26);
        onDetonate(id, at);
        return;
      }

      if (impact < 1.8) return;
      playSound(type === "heavy" ? "heavy" : "hit", impact / 12);

      const point = e.contact?.contactPoint;
      if (effects && point) {
        effects.impact(point[0], point[1], point[2], ballColor, impact / (type === "heavy" ? 9 : 14));
      }
    },
  }));

  useEffect(() => {
    meshRef.current = ref.current;
    const map = registry?.current;
    const obj = ref.current;
    if (!map || !obj) return;

    map.set(id, {
      kind: "projectile",
      obj,
      api,
      mass: spec.mass,
      isMemory: false,
      tint: ballColor,
      origin: new THREE.Vector3(...position),
      age: 0,
      lastPos: new THREE.Vector3(...position),
      restFor: 0,
      expired: false,
    });

    return () => {
      map.delete(id);
    };
  }, [registry, id, ref, api, spec.mass, position, ballColor]);

  return (
    <mesh ref={ref} castShadow>
      {/* 16x12 is indistinguishable from 32x32 at this size and a quarter of the vertices */}
      <sphereGeometry args={[spec.radius, 16, 12]} />
      <meshStandardMaterial
        color={ballColor}
        emissive={ballColor}
        emissiveIntensity={type === "bomb" ? 1.1 : 0.55}
        roughness={0.15}
        metalness={type === "heavy" ? 0.9 : 0.7}
      />
    </mesh>
  );
});

const Shockwave = memo(function Shockwave({
  id,
  position,
  onDone,
}: {
  id: string;
  position: [number, number, number];
  onDone: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const age = useRef(0);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current || !ref.current) return;
    age.current += Math.min(delta, 0.1);
    const k = age.current / 0.62;
    if (k >= 1) {
      done.current = true;
      onDone(id);
      return;
    }
    ref.current.scale.setScalar(0.4 + k * BOMB_RADIUS);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - k) ** 1.5;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial color="#ff5a3c" transparent opacity={0.55} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
});

/* -------------------------------------------------------------------------- */
/* Per-frame director                                                         */
/* -------------------------------------------------------------------------- */

// One useFrame for the whole scene. Previously every node ran its own frame
// callback plus a worker position subscription; cannon already writes body
// transforms straight into the meshes, so reading them here is free.
const SceneDirector = memo(function SceneDirector({
  onMemoryFall,
  onProjectileExpire,
  memoriesLeft,
}: {
  onMemoryFall: (id: string) => void;
  onProjectileExpire: (id: string) => void;
  memoriesLeft: number;
}) {
  const registry = useRegistry();
  const effects = useEffects();
  const memoriesLeftRef = useRef(memoriesLeft);
  useEffect(() => {
    memoriesLeftRef.current = memoriesLeft;
  }, [memoriesLeft]);
  const fallen = useRef<Set<string>>(new Set());
  const cursor = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const map = registry?.current;
    if (!map) return;
    const p = cursor.current;

    // Ages advance with rendered frames, never with the wall clock: a
    // backgrounded tab stops rAF, and a wall-clock deadline would expire every
    // projectile in flight the instant the player came back.
    const step = Math.min(delta, 0.1);
    const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 3.4) * 0.35;

    map.forEach((entry, id) => {
      if (entry.kind === "projectile") {
        if (entry.expired) return;
        bodyPosition(entry.obj, p);
        entry.age += step;

        if (p.distanceToSquared(entry.lastPos) < 1e-5) {
          entry.restFor += step;
        } else {
          entry.restFor = 0;
        }
        entry.lastPos.copy(p);

        if (p.y < PROJECTILE_KILL_Y || entry.restFor > PROJECTILE_REST_S || entry.age > PROJECTILE_TTL_S) {
          entry.expired = true;
          onProjectileExpire(id);
        }
        return;
      }

      if (!entry.isMemory) return;

      const material = (entry.obj as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (fallen.current.has(id)) return;
      if (material) material.emissiveIntensity = pulse;

      bodyPosition(entry.obj, p);
      const drop = entry.origin.y - p.y;
      const spread = Math.hypot(p.x - entry.origin.x, p.z - entry.origin.z);

      // Either a real drop or being knocked clear of its perch counts. The old
      // rule also required y < 1.0, which made memory blocks sitting on raised
      // platforms (level 4) impossible to clear.
      if (drop > MEMORY_FALL_DROP || spread > MEMORY_FALL_SPREAD) {
        fallen.current.add(id);
        if (material) material.emissiveIntensity = 1.8;
        playSound("memory");

        const isWinningBlow = memoriesLeftRef.current - fallen.current.size <= 0;
        effects?.impact(p.x, p.y, p.z, entry.tint, isWinningBlow ? 1 : 0.7);
        // The last memory gets a beat of hitstop and a slow-motion tail so the
        // level ends on the collapse rather than cutting straight to a modal.
        if (isWinningBlow) effects?.hitstop(120, 900);

        onMemoryFall(id);
      }
    });
  });

  return null;
});

/* -------------------------------------------------------------------------- */
/* Aiming                                                                     */
/* -------------------------------------------------------------------------- */

// Draws the actual ballistic path the projectile will follow (same speed, same
// gravity) and a reticle where it lands. The old version drew a straight line
// from the camera, which projects to a dot on screen, and used a dashed
// material without computeLineDistances, so it never dashed either.
//
/* eslint-disable react-hooks/immutability --
   The whole point of this component is writing into one preallocated buffer
   every frame instead of rebuilding a BufferGeometry 60 times a second, which
   is what the previous implementation did. Mutating three.js scene objects in
   useFrame is the r3f model; these rules assume plain React data. */
const AimGuide = memo(function AimGuide({
  color,
  wildcard,
  power,
  targetsRef,
  aim,
}: {
  color: string;
  wildcard: WildcardType;
  power: number;
  targetsRef: React.RefObject<THREE.Group | null>;
  aim: AimSource;
}) {
  const { camera, raycaster } = useThree();

  const { line, reticle, positions } = useMemo(() => {
    const positions = new Float32Array(ARC_STEPS * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    // depthTest off + a high renderOrder: this is a HUD. The reticle sits
    // exactly on the surface it marks, so with depth testing on it z-fights
    // and disappears into the very block the player is aiming at.
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false, depthTest: false });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 998;

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.3, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, side: THREE.DoubleSide })
    );
    reticle.frustumCulled = false;
    reticle.renderOrder = 999;

    return { line, reticle, positions };
  }, [color]);

  // Geometries and materials created outside of R3F's tree are ours to dispose.
  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      reticle.geometry.dispose();
      (reticle.material as THREE.Material).dispose();
    };
  }, [line, reticle]);

  useEffect(() => {
    (line.material as THREE.LineBasicMaterial).color.set(color);
    (reticle.material as THREE.MeshBasicMaterial).color.set(color);
  }, [color, line, reticle]);

  // Held in a ref, not a memo: these vectors are scratch space mutated every
  // frame, and re-allocating them 60x a second is exactly what we're avoiding.
  const scratchRef = useRef<{ p: THREE.Vector3; v: THREE.Vector3; prev: THREE.Vector3; muzzle: THREE.Vector3 } | null>(null);

  useFrame(() => {
    if (!scratchRef.current) {
      scratchRef.current = {
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        prev: new THREE.Vector3(),
        muzzle: new THREE.Vector3(),
      };
    }
    const scratch = scratchRef.current;

    // Hidden while a touch player has no finger down: nothing to preview.
    line.visible = aim.visible;
    reticle.visible = aim.visible;
    if (!aim.visible) return;

    raycaster.setFromCamera(aim.ndc, camera);
    const dir = raycaster.ray.direction;
    const speed = shotSpeedFor(wildcard, power);

    scratch.muzzle.copy(camera.position).addScaledVector(dir, MUZZLE_OFFSET);

    // Stop the preview at whatever the player is actually pointing at.
    let maxDist = Infinity;
    const group = targetsRef.current;
    if (group) {
      const hits = raycaster.intersectObject(group, true);
      if (hits.length > 0) maxDist = hits[0].distance;
    }

    scratch.p.copy(scratch.muzzle);
    scratch.v.copy(dir).multiplyScalar(speed);
    scratch.prev.copy(scratch.p);

    const dt = 1 / 34;
    let travelled = 0;
    let count = 0;

    for (let i = 0; i < ARC_STEPS; i++) {
      positions[count * 3] = scratch.p.x;
      positions[count * 3 + 1] = scratch.p.y;
      positions[count * 3 + 2] = scratch.p.z;
      count++;

      if (scratch.p.y <= 0.02 || travelled >= maxDist) break;

      scratch.prev.copy(scratch.p);
      scratch.p.addScaledVector(scratch.v, dt);
      scratch.v.y -= GRAVITY * dt;
      travelled += scratch.prev.distanceTo(scratch.p);
    }

    line.geometry.setDrawRange(0, count);
    (line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    const last = count - 1;
    reticle.position.set(positions[last * 3], positions[last * 3 + 1] + 0.02, positions[last * 3 + 2]);
    reticle.lookAt(camera.position);
  });

  return (
    <>
      <primitive object={line} />
      <primitive object={reticle} />
    </>
  );
});
/* eslint-enable react-hooks/immutability */

// Tap to shoot, drag to orbit. Listening on the canvas element instead of an
// invisible 1000x1000 plane removes a mesh from every raycast and gets exact
// NDC coordinates on touch, where r3f's shared `pointer` is stale until a move.
const ShootController = memo(function ShootController({
  onShoot,
  canShoot,
  activeWildcard,
  shotPower,
  aim,
}: {
  onShoot: (shots: { pos: [number, number, number]; vel: [number, number, number]; type: WildcardType }[]) => void;
  canShoot: boolean;
  activeWildcard: WildcardType;
  shotPower: number;
  aim: AimSource;
}) {
  const { camera, gl, raycaster } = useThree();

  // The DOM listeners below are attached once; this ref keeps them reading the
  // current wildcard/power without tearing them down on every prop change.
  const stateRef = useRef({ onShoot, canShoot, activeWildcard, shotPower });
  useEffect(() => {
    stateRef.current = { onShoot, canShoot, activeWildcard, shotPower };
  }, [onShoot, canShoot, activeWildcard, shotPower]);

  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const yAxis = new THREE.Vector3(0, 1, 0);
    let down: { x: number; y: number } | null = null;
    let lastShotAt = 0;

    const writeAim = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      aim.ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      down = { x: e.clientX, y: e.clientY };
      writeAim(e);
      aim.visible = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      // A mouse aims by hovering; a finger only aims while it is held down.
      if (e.pointerType === "mouse" || down) {
        writeAim(e);
        aim.visible = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!e.isPrimary || !down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;

      // Keep the guide up for a hovering mouse, drop it when a finger lifts.
      if (e.pointerType !== "mouse") aim.visible = false;

      // Distance is the only thing that separates a shot from a camera orbit —
      // deliberately not duration. Holding still *is* the aiming gesture now,
      // and lining up a shot on a phone easily takes a couple of seconds.
      // Sliding the finger away is what cancels.
      if (moved > 10) return;

      const { canShoot: allowed, activeWildcard: wildcard, shotPower: power, onShoot: shoot } = stateRef.current;
      if (!allowed) return;

      const now = performance.now();
      if (now - lastShotAt < SHOT_COOLDOWN_MS) return;
      lastShotAt = now;

      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      const dir = raycaster.ray.direction.clone();
      const speed = shotSpeedFor(wildcard, power);
      const origin = camera.position.clone().addScaledVector(dir, MUZZLE_OFFSET);
      const pos = origin.toArray() as [number, number, number];

      playSound("shoot");

      if (wildcard === "triple") {
        const spread = [0, -0.1, 0.1].map((angle) =>
          dir.clone().applyAxisAngle(yAxis, angle).multiplyScalar(speed).toArray() as [number, number, number]
        );
        shoot(spread.map((vel) => ({ pos, vel, type: "triple" as WildcardType })));
      } else {
        shoot([{ pos, vel: dir.multiplyScalar(speed).toArray() as [number, number, number], type: wildcard }]);
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      down = null;
      if (e.pointerType !== "mouse") aim.visible = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("pointerleave", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("pointerleave", onPointerCancel);
    };
  }, [gl, camera, raycaster, aim]);

  return null;
});

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

const LevelScene = memo(function LevelScene({
  level,
  projectiles,
  shockwaves,
  onMemoryFall,
  onProjectileExpire,
  onDetonate,
  onShockwaveDone,
  targetsRef,
  totalMemories,
}: {
  level: LevelSchema;
  projectiles: ProjectileState[];
  shockwaves: { id: string; pos: [number, number, number] }[];
  onMemoryFall: (id: string) => void;
  onProjectileExpire: (id: string) => void;
  onDetonate: (id: string, at: [number, number, number]) => void;
  onShockwaveDone: (id: string) => void;
  targetsRef: React.RefObject<THREE.Group | null>;
  totalMemories: number;
}) {
  return (
    <>
      <Ground color={level.palette.ground} />

      <group ref={targetsRef}>
        {level.nodes.map((node) =>
          node.type === "cylinder" ? (
            <CylinderNode key={node.id} node={node} />
          ) : (
            <BoxNode key={node.id} node={node} />
          )
        )}
      </group>

      <group>
        {projectiles.map((p) => (
          <Projectile
            key={p.id}
            id={p.id}
            position={p.pos}
            velocity={p.vel}
            color={level.palette.projectile}
            type={p.type}
            onDetonate={onDetonate}
          />
        ))}
      </group>

      {shockwaves.map((s) => (
        <Shockwave key={s.id} id={s.id} position={s.pos} onDone={onShockwaveDone} />
      ))}

      <SceneDirector
        onMemoryFall={onMemoryFall}
        onProjectileExpire={onProjectileExpire}
        memoriesLeft={totalMemories}
      />
    </>
  );
});

/* -------------------------------------------------------------------------- */
/* Camera framing                                                             */
/* -------------------------------------------------------------------------- */

// Generated levels vary a lot in height and width, so a fixed camera either
// clips a three-tier citadel or leaves a single tower as a speck. This fits the
// level's bounding box to the viewport once, when the level changes.
const CameraFraming = memo(function CameraFraming({ level }: { level: LevelSchema }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  const size = useThree((s) => s.size);

  useEffect(() => {
    let top = 0;
    let halfWidth = 0;
    let halfDepth = 0;

    for (const node of level.nodes) {
      const [dx, dy, dz] = node.dimensions;
      const [w, h, d] =
        node.type === "cylinder" ? [Math.max(dx, dy) * 2, dz, Math.max(dx, dy) * 2] : [dx, dy, dz];
      top = Math.max(top, node.position[1] + h / 2);
      halfWidth = Math.max(halfWidth, Math.abs(node.position[0]) + w / 2);
      halfDepth = Math.max(halfDepth, Math.abs(node.position[2]) + d / 2);
    }

    const fovY = (camera.fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    // Generous margin so the structure never tucks under the floating HUD bars.
    const fitHeight = (top + 2.6) / (2 * Math.tan(fovY / 2));
    const fitWidth = (halfWidth + 2.6) / (2 * Math.tan(fovY / 2) * aspect);
    const distance = Math.max(9, Math.max(fitHeight, fitWidth) * 1.3 + halfDepth);

    const focusY = top * 0.45;
    camera.position.set(0, focusY + top * 0.35 + 1.5, distance);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(0, focusY, 0);
      controls.update();
    } else {
      camera.lookAt(0, focusY, 0);
    }
  }, [level, camera, controls, size.width, size.height]);

  return null;
});

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

// Everything that a reset must throw away lives here. Remounting this with a
// new key is the reset — no effect has to hand-clear a dozen pieces of state,
// and the Canvas (with its WebGL context) survives untouched.
const GameSession = memo(function GameSession({
  level,
  activeWildcard,
  shotPower,
  onMemoryBlockTriggered,
  onComboTriggered,
  onWildcardAmmoUpdate,
  onLevelCompleted,
  onOutOfAmmo,
  onStatsUpdate,
}: {
  level: LevelSchema;
  activeWildcard: WildcardType;
  shotPower: number;
  onMemoryBlockTriggered: (memory?: MemoryItem) => void;
  onComboTriggered?: (comboCount: number) => void;
  onWildcardAmmoUpdate?: (ammo: WildcardAmmo) => void;
  onLevelCompleted?: (result: LevelResult) => void;
  onOutOfAmmo?: () => void;
  onStatsUpdate?: (stats: { remainingBalls: number; memoryBlocksLeft: number; totalMemoryBlocks: number }) => void;
}) {
  const [projectiles, setProjectiles] = useState<ProjectileState[]>([]);
  const [shockwaves, setShockwaves] = useState<{ id: string; pos: [number, number, number] }[]>([]);
  const [shotsUsed, setShotsUsed] = useState(0);
  const [clearedMemories, setClearedMemories] = useState(0);
  const [wildcardAmmo, setWildcardAmmo] = useState<WildcardAmmo>(INITIAL_WILDCARD_AMMO);
  // Mirrors the state so the shoot handler can read the current charges without
  // re-creating itself (and re-registering the DOM listeners) on every change.
  const wildcardAmmoRef = useRef<WildcardAmmo>(INITIAL_WILDCARD_AMMO);
  // "freeze" stops the solver dead; "slow" lets it advance a single fixed step
  // per rendered frame, which cannon caps without banking the leftover time.
  const [timeMode, setTimeMode] = useState<"normal" | "freeze" | "slow">("normal");

  const registry = useRef<Map<string, BodyEntry>>(new Map());
  const targetsRef = useRef<THREE.Group | null>(null);
  // Shared between the shoot controller (writer) and the aim guide (reader).
  const aim = useMemo(() => createAimSource(), []);
  const projCounterRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const hasOutOfAmmoRef = useRef(false);
  const lastStatsRef = useRef({ remainingBalls: -1, memoryBlocksLeft: -1, totalMemoryBlocks: -1 });
  const lastFallTimeRef = useRef(0);
  const comboCountRef = useRef(0);

  const totalMemoryBlocks = useMemo(() => level.nodes.filter((n) => n.isMemoryBlock).length, [level]);

  useEffect(() => {
    onWildcardAmmoUpdate?.(wildcardAmmo);
  }, [wildcardAmmo, onWildcardAmmoUpdate]);

  const handleMemoryFall = useCallback(() => {
    setClearedMemories((n) => n + 1);

    const now = performance.now();
    if (now - lastFallTimeRef.current < 2400) {
      comboCountRef.current += 1;
    } else {
      comboCountRef.current = 1;
    }
    lastFallTimeRef.current = now;

    if (comboCountRef.current >= 2) {
      onComboTriggered?.(comboCountRef.current);
    }

    const memoryItem = getRandomMemory();
    onMemoryBlockTriggered?.(memoryItem);
  }, [onMemoryBlockTriggered, onComboTriggered]);

  const handleProjectileExpire = useCallback((id: string) => {
    setProjectiles((prev) => (prev.some((p) => p.id === id) ? prev.filter((p) => p.id !== id) : prev));
  }, []);

  const handleDetonate = useCallback((id: string, at: [number, number, number]) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
    setShockwaves((prev) => [...prev, { id: `wave-${id}`, pos: at }]);
  }, []);

  const handleShockwaveDone = useCallback((id: string) => {
    setShockwaves((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const hitstopTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = hitstopTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleHitstop = useCallback((freezeMs: number, slowMs: number) => {
    setTimeMode("freeze");
    hitstopTimers.current.push(
      setTimeout(() => setTimeMode("slow"), freezeMs),
      setTimeout(() => setTimeMode("normal"), freezeMs + slowMs)
    );
  }, []);

  const handleShoot = useCallback(
    (shots: { pos: [number, number, number]; vel: [number, number, number]; type: WildcardType }[]) => {
      const type = shots[0]?.type || "standard";

      // The charge rule lives here rather than only in the button's disabled
      // state: the UI can lag a frame behind the ammo it renders, and a shot
      // that slips through would be a free wildcard.
      if (type !== "standard" && wildcardAmmoRef.current[type] <= 0) return;

      if (type !== "standard") {
        wildcardAmmoRef.current = {
          ...wildcardAmmoRef.current,
          [type]: wildcardAmmoRef.current[type] - 1,
        };
        setWildcardAmmo(wildcardAmmoRef.current);
      }

      // A volley is one shot, however many balls it puts in the air.
      setShotsUsed((n) => n + 1);
      setProjectiles((prev) => {
        const next = [
          ...prev,
          ...shots.map((s) => ({ id: `proj-${projCounterRef.current++}`, pos: s.pos, vel: s.vel, type: s.type })),
        ];
        // Cap the live body count so a fast player can't stack 45 rigid bodies.
        return next.length > MAX_LIVE_PROJECTILES ? next.slice(next.length - MAX_LIVE_PROJECTILES) : next;
      });
    },
    []
  );

  const remainingBalls = Math.max(0, level.projectile_limit - shotsUsed);
  const memoryBlocksLeft = Math.max(0, totalMemoryBlocks - clearedMemories);

  useEffect(() => {
    const last = lastStatsRef.current;
    if (
      last.remainingBalls !== remainingBalls ||
      last.memoryBlocksLeft !== memoryBlocksLeft ||
      last.totalMemoryBlocks !== totalMemoryBlocks
    ) {
      lastStatsRef.current = { remainingBalls, memoryBlocksLeft, totalMemoryBlocks };
      onStatsUpdate?.({ remainingBalls, memoryBlocksLeft, totalMemoryBlocks });
    }
  }, [remainingBalls, memoryBlocksLeft, totalMemoryBlocks, onStatsUpdate]);

  useEffect(() => {
    if (totalMemoryBlocks === 0 || memoryBlocksLeft > 0 || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    playSound("victory");
    // Long enough for the hitstop and slow-motion tail to play out before the
    // modal covers the collapse.
    const timer = setTimeout(
      () => onLevelCompleted?.({ shotsUsed, projectileLimit: level.projectile_limit }),
      1400
    );
    return () => clearTimeout(timer);
  }, [memoryBlocksLeft, totalMemoryBlocks, onLevelCompleted, shotsUsed, level.projectile_limit]);

  // Out of ammo only once the board has actually settled — the last shot often
  // brings a tower down a second or two after it lands.
  useEffect(() => {
    if (hasCompletedRef.current || hasOutOfAmmoRef.current) return;
    if (remainingBalls > 0 || memoryBlocksLeft === 0) return;
    if (projectiles.length > 0) return;

    const timer = setTimeout(() => {
      if (hasCompletedRef.current) return;
      hasOutOfAmmoRef.current = true;
      onOutOfAmmo?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [remainingBalls, memoryBlocksLeft, projectiles.length, onOutOfAmmo]);

  const trajectoryColor = WILDCARD_SPECS[activeWildcard].color ?? level.palette.projectile;
  const canShoot = remainingBalls > 0 && (totalMemoryBlocks === 0 || memoryBlocksLeft > 0);

  return (
    <RegistryContext.Provider value={registry}>
      <EffectsRig onHitstop={handleHitstop}>
      <Physics
        isPaused={timeMode === "freeze"}
        // maxSubSteps 1 makes the world advance exactly one fixed step per
        // frame instead of catching up to real time — cannon discards the
        // leftover accumulator, so there is no fast-forward on the way out.
        maxSubSteps={timeMode === "slow" ? 1 : 8}
        gravity={[0, -GRAVITY, 0]}
        // A projectile at max power covers ~0.24 units per step at this rate,
        // less than the smallest collider radius, so nothing tunnels through.
        stepSize={PHYSICS_STEP}
        iterations={14}
        // Settled towers stop being integrated entirely; with ~20 bodies the
        // default Naive broadphase is cheaper than SAP's per-step sort.
        allowSleep
        defaultContactMaterial={{
          friction: 0.55,
          restitution: 0.06,
          contactEquationStiffness: 1e7,
          contactEquationRelaxation: 3,
          frictionEquationStiffness: 1e7,
          frictionEquationRelaxation: 3,
        }}
      >
        <LevelScene
          level={level}
          projectiles={projectiles}
          shockwaves={shockwaves}
          onMemoryFall={handleMemoryFall}
          onProjectileExpire={handleProjectileExpire}
          onDetonate={handleDetonate}
          onShockwaveDone={handleShockwaveDone}
          targetsRef={targetsRef}
          totalMemories={totalMemoryBlocks}
        />
      </Physics>

      {canShoot && (
        <AimGuide
          color={trajectoryColor}
          wildcard={activeWildcard}
          power={shotPower}
          targetsRef={targetsRef}
          aim={aim}
        />
      )}
      <ShootController
        onShoot={handleShoot}
        canShoot={canShoot}
        activeWildcard={activeWildcard}
        shotPower={shotPower}
        aim={aim}
      />
      </EffectsRig>
    </RegistryContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Game                                                                       */
/* -------------------------------------------------------------------------- */

export default function SmashFestGame({
  levelId,
  activeWildcard = "standard",
  shotPower = 1.0,
  resetKey = 0,
  levelOverride = null,
  onMemoryBlockTriggered,
  onComboTriggered,
  onWildcardAmmoUpdate,
  onLevelCompleted,
  onOutOfAmmo,
  onStatsUpdate,
  isSoundMuted = false,
}: SmashFestGameProps) {
  // Remote levels are cached per id: switching back and forth between levels
  // no longer refetches, and the bundled level renders immediately meanwhile.
  const [remoteLevels, setRemoteLevels] = useState<Record<string, LevelSchema>>({});
  const requestedRef = useRef<Set<string>>(new Set());

  const level = useMemo(
    () =>
      levelOverride
        ? normalizeLevel(levelOverride)
        : remoteLevels[levelId] ?? normalizeLevel(DEFAULT_LEVELS[levelId] || DEFAULT_LEVELS.level_1),
    [levelOverride, remoteLevels, levelId]
  );

  useEffect(() => {
    setSoundMuted(isSoundMuted);
  }, [isSoundMuted]);

  useEffect(() => {
    if (levelOverride) return;
    if (requestedRef.current.has(levelId)) return;
    requestedRef.current.add(levelId);

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("smash_fest_levels").select("*").eq("level_id", levelId).single();
        if (!error && data && !cancelled) {
          setRemoteLevels((prev) => ({ ...prev, [levelId]: normalizeLevel(data as LevelSchema) }));
        }
      } catch {
        // Offline or table missing: the bundled level is already on screen.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [levelId, levelOverride]);

  return (
    <div className="w-full h-full relative z-0">
      <Canvas
        shadows
        // Uncapped DPR on a retina display quadruples the fragment cost for no
        // visible gain on a scene this simple.
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 6, 14], fov: 50, near: 0.1, far: 120 }}
      >
        <color attach="background" args={[level.palette.background]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[12, 18, 10]}
          castShadow
          intensity={1.15}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0006}
          // The default shadow frustum is 10 units across and clipped most of
          // the playfield out of the shadow map.
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-near={1}
          shadow-camera-far={48}
        />
        <pointLight position={[0, 9, 4]} intensity={0.55} color="#ff4b89" />

        <CameraFraming level={level} />

        <GameSession
          key={`${level.level_id}-${resetKey}`}
          level={level}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          onMemoryBlockTriggered={onMemoryBlockTriggered}
          onComboTriggered={onComboTriggered}
          onWildcardAmmoUpdate={onWildcardAmmoUpdate}
          onLevelCompleted={onLevelCompleted}
          onOutOfAmmo={onOutOfAmmo}
          onStatsUpdate={onStatsUpdate}
        />

        <OrbitControls
          makeDefault
          enableZoom
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          minDistance={7}
          maxDistance={45}
          target={[0, 2.2, 0]}
          maxPolarAngle={Math.PI / 2 - 0.06}
        />
      </Canvas>
    </div>
  );
}
