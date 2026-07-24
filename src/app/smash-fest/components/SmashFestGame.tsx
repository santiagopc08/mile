"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics, useBox, useCylinder, usePlane, useSphere } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabaseClient";

export type WildcardType = "standard" | "bomb" | "triple" | "heavy";

export interface LevelNode {
  id: string;
  type: "box" | "cylinder";
  dimensions: [number, number, number];
  position: [number, number, number];
  mass: number;
  friction: number;
  material: string; // "stone" | "wood" | "metal" | "special"
  isMemoryBlock?: boolean;
}

export interface LevelSchema {
  level_id: string;
  name: string;
  palette: {
    background: string;
    projectile: string;
    ground: string;
  };
  projectile_limit: number;
  nodes: LevelNode[];
}

interface SmashFestGameProps {
  levelId: string;
  activeWildcard: WildcardType;
  shotPower: number; // Multiplier 0.5 - 1.5
  onMemoryBlockTriggered: () => void;
  onLevelCompleted?: () => void;
  onOutOfAmmo?: () => void;
  onStatsUpdate?: (stats: { remainingBalls: number; memoryBlocksLeft: number; totalMemoryBlocks: number }) => void;
  isSoundMuted?: boolean;
}

// 6 Escalating Levels with Heavy Structural Physics & Solid Support Masses
export const DEFAULT_LEVELS: Record<string, LevelSchema> = {
  level_1: {
    level_id: "level_1",
    name: "Torre Inicial",
    palette: {
      background: "#0c0a14",
      projectile: "#ff4b89",
      ground: "#1a1222",
    },
    projectile_limit: 8,
    nodes: [
      { id: "base1", type: "box", dimensions: [3, 0.8, 3], position: [0, 0.4, 0], mass: 250, friction: 0.9, material: "stone" },
      { id: "pillar1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, -1], mass: 45, friction: 0.85, material: "wood" },
      { id: "pillar2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, -1], mass: 45, friction: 0.85, material: "wood" },
      { id: "pillar3", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, 1], mass: 45, friction: 0.85, material: "wood" },
      { id: "pillar4", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, 1], mass: 45, friction: 0.85, material: "wood" },
      { id: "top1", type: "box", dimensions: [3, 0.5, 3], position: [0, 3.05, 0], mass: 80, friction: 0.85, material: "wood" },
      { id: "mem1", type: "box", dimensions: [1, 1, 1], position: [0, 4.0, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },
    ],
  },
  level_2: {
    level_id: "level_2",
    name: "Castillo Gemelo",
    palette: {
      background: "#0a0c16",
      projectile: "#c3f400",
      ground: "#121a28",
    },
    projectile_limit: 10,
    nodes: [
      // Left Tower
      { id: "l_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [-2.5, 0.4, 0], mass: 200, friction: 0.9, material: "stone" },
      { id: "l_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-3.2, 1.9, 0], mass: 45, friction: 0.85, material: "wood" },
      { id: "l_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-1.8, 1.9, 0], mass: 45, friction: 0.85, material: "wood" },
      { id: "l_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [-2.5, 3.25, 0], mass: 70, friction: 0.85, material: "wood" },
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 4.1, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },

      // Right Tower
      { id: "r_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [2.5, 0.4, 0], mass: 200, friction: 0.9, material: "stone" },
      { id: "r_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [1.8, 1.9, 0], mass: 45, friction: 0.85, material: "wood" },
      { id: "r_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [3.2, 1.9, 0], mass: 45, friction: 0.85, material: "wood" },
      { id: "r_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [2.5, 3.25, 0], mass: 70, friction: 0.85, material: "wood" },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 4.1, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },

      // Connecting Bridge
      { id: "bridge", type: "box", dimensions: [3.5, 0.4, 1.5], position: [0, 3.4, 0], mass: 50, friction: 0.85, material: "wood" },
    ],
  },
  level_3: {
    level_id: "level_3",
    name: "Fortaleza de Cristal",
    palette: {
      background: "#120818",
      projectile: "#00dbe9",
      ground: "#22102b",
    },
    projectile_limit: 12,
    nodes: [
      // Base Grid
      { id: "b1", type: "box", dimensions: [1.8, 1.0, 1.8], position: [-1.8, 0.5, 0], mass: 180, friction: 0.9, material: "stone" },
      { id: "b2", type: "box", dimensions: [1.8, 1.0, 1.8], position: [0, 0.5, 0], mass: 180, friction: 0.9, material: "stone" },
      { id: "b3", type: "box", dimensions: [1.8, 1.0, 1.8], position: [1.8, 0.5, 0], mass: 180, friction: 0.9, material: "stone" },
      
      // Tier 2
      { id: "t2_p1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1.2, 2.0, 0], mass: 50, friction: 0.85, material: "wood" },
      { id: "t2_p2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1.2, 2.0, 0], mass: 50, friction: 0.85, material: "wood" },
      { id: "t2_slab", type: "box", dimensions: [4.5, 0.5, 2.0], position: [0, 3.25, 0], mass: 90, friction: 0.85, material: "wood" },

      // Memory Blocks Tier
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-1.5, 4.0, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0, 4.0, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [1.5, 4.0, 0], mass: 30, friction: 0.95, material: "special", isMemoryBlock: true },
    ],
  },
  level_4: {
    level_id: "level_4",
    name: "Laberinto Flotante",
    palette: {
      background: "#081216",
      projectile: "#a178ff",
      ground: "#10242e",
    },
    projectile_limit: 12,
    nodes: [
      { id: "p1", type: "box", dimensions: [2.5, 0.6, 2.5], position: [-3, 1.2, -1], mass: 160, friction: 0.9, material: "stone" },
      { id: "p2", type: "box", dimensions: [2.5, 0.6, 2.5], position: [3, 1.2, -1], mass: 160, friction: 0.9, material: "stone" },
      { id: "p3", type: "box", dimensions: [3.0, 0.6, 3.0], position: [0, 2.8, 1], mass: 180, friction: 0.9, material: "stone" },

      { id: "c1", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [-3, 2.4, -1], mass: 40, friction: 0.85, material: "wood" },
      { id: "c2", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [3, 2.4, -1], mass: 40, friction: 0.85, material: "wood" },
      { id: "c3", type: "cylinder", dimensions: [0.35, 0.35, 1.8], position: [0, 4.0, 1], mass: 40, friction: 0.85, material: "wood" },

      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-3, 3.7, -1], mass: 25, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [3, 3.7, -1], mass: 25, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-0.8, 5.3, 1], mass: 25, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0.8, 5.3, 1], mass: 25, friction: 0.95, material: "special", isMemoryBlock: true },
    ],
  },
  level_5: {
    level_id: "level_5",
    name: "Bastión Acorazado",
    palette: {
      background: "#180a0a",
      projectile: "#ff003c",
      ground: "#2d1212",
    },
    projectile_limit: 14,
    nodes: [
      // Armor Front Wall (Metal)
      { id: "metal1", type: "box", dimensions: [5.0, 1.8, 0.6], position: [0, 0.9, 2], mass: 300, friction: 0.95, material: "metal" },
      { id: "metal2", type: "box", dimensions: [5.0, 1.8, 0.6], position: [0, 2.7, 2], mass: 300, friction: 0.95, material: "metal" },

      // Inner Keep Towers
      { id: "ik1", type: "box", dimensions: [2.0, 0.8, 2.0], position: [-1.8, 0.4, -0.5], mass: 200, friction: 0.9, material: "stone" },
      { id: "ik2", type: "box", dimensions: [2.0, 0.8, 2.0], position: [1.8, 0.4, -0.5], mass: 200, friction: 0.9, material: "stone" },

      { id: "ik_c1", type: "cylinder", dimensions: [0.4, 0.4, 2.5], position: [-1.8, 2.1, -0.5], mass: 60, friction: 0.85, material: "wood" },
      { id: "ik_c2", type: "cylinder", dimensions: [0.4, 0.4, 2.5], position: [1.8, 2.1, -0.5], mass: 60, friction: 0.85, material: "wood" },

      // Memory Core
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-1.8, 3.8, -0.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [1.8, 3.8, -0.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-0.9, 4.2, 2], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0.9, 4.2, 2], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
    ],
  },
  level_6: {
    level_id: "level_6",
    name: "Ciudadela Cósmica",
    palette: {
      background: "#0d0614",
      projectile: "#ff4b89",
      ground: "#200e30",
    },
    projectile_limit: 15,
    nodes: [
      // Central Citadel Spire
      { id: "spire_base", type: "cylinder", dimensions: [1.5, 1.8, 1.5], position: [0, 0.75, 0], mass: 350, friction: 0.95, material: "stone" },
      { id: "spire_mid", type: "cylinder", dimensions: [1.2, 1.2, 2.5], position: [0, 2.75, 0], mass: 200, friction: 0.9, material: "stone" },
      { id: "spire_top", type: "box", dimensions: [3.2, 0.6, 3.2], position: [0, 4.3, 0], mass: 120, friction: 0.85, material: "wood" },

      // Outer Ring Pillars
      { id: "op1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-2.5, 1.1, -2.5], mass: 50, friction: 0.85, material: "wood" },
      { id: "op2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [2.5, 1.1, -2.5], mass: 50, friction: 0.85, material: "wood" },
      { id: "op3", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-2.5, 1.1, 2.5], mass: 50, friction: 0.85, material: "wood" },
      { id: "op4", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [2.5, 1.1, 2.5], mass: 50, friction: 0.85, material: "wood" },

      // Memory Blocks Crown
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0, 5.2, 0], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 2.6, -2.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 2.6, -2.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem4", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 2.6, 2.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
      { id: "mem5", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 2.6, 2.5], mass: 35, friction: 0.95, material: "special", isMemoryBlock: true },
    ],
  },
};

// Web Audio API Sound Synthesizer
function playWebAudioSound(type: "shoot" | "hit" | "memory" | "victory" | "bomb" | "heavy") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === "hit") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "bomb") {
      osc.type = "square";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "heavy") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "memory") {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.18, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.35);
      });
    } else if (type === "victory") {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.22, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.5);
      });
    }
  } catch (e) {
    // Ignore audio context restrictions
  }
}

// Ground Grid
const Ground = memo(function Ground({ color }: { color: string }) {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    material: { friction: 0.95, restitution: 0.05 },
  })) as any;
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
    </mesh>
  );
});

// Projectile Ball (with Wildcard Physics Variant)
const Projectile = memo(function Projectile({
  position,
  velocity,
  color,
  type = "standard",
  isMuted,
}: {
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  type?: WildcardType;
  isMuted?: boolean;
}) {
  const mass = type === "heavy" ? 500 : type === "bomb" ? 90 : type === "triple" ? 80 : 120;
  const radius = type === "heavy" ? 0.65 : type === "bomb" ? 0.45 : type === "triple" ? 0.32 : 0.38;
  const ballColor = type === "bomb" ? "#ff003c" : type === "heavy" ? "#a178ff" : type === "triple" ? "#c3f400" : color;

  const [ref] = useSphere(() => ({
    mass,
    position,
    velocity,
    args: [radius],
    onCollide: () => {
      if (!isMuted) {
        if (type === "bomb") playWebAudioSound("bomb");
        else if (type === "heavy") playWebAudioSound("heavy");
        else playWebAudioSound("hit");
      }
    },
  })) as any;

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={ballColor}
        emissive={ballColor}
        emissiveIntensity={type === "bomb" ? 1.2 : 0.6}
        roughness={0.1}
        metalness={type === "heavy" ? 0.95 : 0.8}
      />
      <pointLight color={ballColor} intensity={type === "bomb" ? 3 : 1.5} distance={type === "bomb" ? 8 : 4} />
    </mesh>
  );
});

// Box Node Component with Dampened Physics & Fall Validation
const BoxNode = memo(function BoxNode({ node, onTrigger, isMuted }: { node: LevelNode; onTrigger: () => void; isMuted?: boolean }) {
  const [ref, api] = useBox(() => ({
    mass: node.mass,
    position: node.position,
    args: node.dimensions,
    linearDamping: 0.35,
    angularDamping: 0.45,
    material: { friction: node.friction || 0.9, restitution: 0.1 },
    onCollide: () => {
      if (!isMuted && !node.isMemoryBlock) playWebAudioSound("hit");
    },
  })) as any;

  const position = useRef<[number, number, number]>(node.position);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
      position.current = v;
    });
    return unsubscribe;
  }, [api]);

  useFrame(() => {
    if (!node.isMemoryBlock || hasTriggered.current) return;

    const hasFallenToGround = position.current[1] < 1.0;
    const hasDroppedSignificantly = (node.position[1] - position.current[1]) > 1.2;

    if (hasFallenToGround && hasDroppedSignificantly) {
      hasTriggered.current = true;
      if (!isMuted) playWebAudioSound("memory");
      onTrigger();
    }
  });

  const nodeColor = node.isMemoryBlock
    ? "#ff4b89"
    : node.material === "metal"
    ? "#4b5563"
    : node.material === "stone"
    ? "#382e39"
    : "#6e5a6a";

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={node.dimensions} />
      <meshStandardMaterial
        color={nodeColor}
        emissive={node.isMemoryBlock ? "#ff4b89" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.95 : 0}
        metalness={node.isMemoryBlock ? 0.9 : node.material === "metal" ? 0.95 : 0.3}
        roughness={node.isMemoryBlock ? 0.1 : node.material === "metal" ? 0.2 : 0.5}
      />
      {node.isMemoryBlock && <pointLight color="#ff4b89" intensity={2.5} distance={6} />}
    </mesh>
  );
});

// Cylinder Node Component with Dampened Physics & Fall Validation
const CylinderNode = memo(function CylinderNode({ node, onTrigger, isMuted }: { node: LevelNode; onTrigger: () => void; isMuted?: boolean }) {
  const args: [number, number, number, number] = [node.dimensions[0], node.dimensions[1], node.dimensions[2], 16];
  const [ref, api] = useCylinder(() => ({
    mass: node.mass,
    position: node.position,
    args,
    linearDamping: 0.35,
    angularDamping: 0.45,
    material: { friction: node.friction || 0.9, restitution: 0.1 },
    onCollide: () => {
      if (!isMuted && !node.isMemoryBlock) playWebAudioSound("hit");
    },
  })) as any;

  const position = useRef<[number, number, number]>(node.position);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
      position.current = v;
    });
    return unsubscribe;
  }, [api]);

  useFrame(() => {
    const hasFallenToGround = position.current[1] < 1.0;
    const hasDroppedSignificantly = (node.position[1] - position.current[1]) > 1.2;

    if (!hasTriggered.current && node.isMemoryBlock && hasFallenToGround && hasDroppedSignificantly) {
      hasTriggered.current = true;
      if (!isMuted) playWebAudioSound("memory");
      onTrigger();
    }
  });

  const nodeColor = node.isMemoryBlock
    ? "#c3f400"
    : node.material === "metal"
    ? "#475569"
    : "#4a3c48";

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <cylinderGeometry args={[node.dimensions[0], node.dimensions[1], node.dimensions[2], 32]} />
      <meshStandardMaterial
        color={nodeColor}
        emissive={node.isMemoryBlock ? "#c3f400" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.95 : 0}
        metalness={node.isMemoryBlock ? 0.9 : node.material === "metal" ? 0.95 : 0.3}
        roughness={node.isMemoryBlock ? 0.1 : node.material === "metal" ? 0.2 : 0.5}
      />
      {node.isMemoryBlock && <pointLight color="#c3f400" intensity={2.5} distance={6} />}
    </mesh>
  );
});

// Laser Trajectory Line
const TrajectoryLine = memo(function TrajectoryLine({ color }: { color: string }) {
  const { camera, raycaster, pointer } = useThree();
  const lineRef = useRef<THREE.Line>(null);

  useFrame(() => {
    if (!lineRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const start = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(0.8));
    const end = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(22));

    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    lineRef.current.geometry.dispose();
    lineRef.current.geometry = geometry;
  });

  return (
    <line ref={lineRef as any}>
      <bufferGeometry />
      <lineDashedMaterial color={color} dashSize={0.4} gapSize={0.2} opacity={0.65} transparent />
    </line>
  );
});

// Raycasting Pointer & Shoot Interaction Handler
const InteractionHandler = memo(function InteractionHandler({
  onShoot,
  limit,
  current,
  activeWildcard,
  shotPower,
  isMuted,
}: {
  onShoot: (shots: { pos: [number, number, number]; vel: [number, number, number]; type: WildcardType }[]) => void;
  limit: number;
  current: number;
  activeWildcard: WildcardType;
  shotPower: number;
  isMuted?: boolean;
}) {
  const { camera, raycaster, pointer } = useThree();
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: any) => {
    pointerStartRef.current = { x: e.clientX || 0, y: e.clientY || 0 };
  };

  const handlePointerUp = (e: any) => {
    if (current >= limit) return;
    const dx = Math.abs((e.clientX || 0) - pointerStartRef.current.x);
    const dy = Math.abs((e.clientY || 0) - pointerStartRef.current.y);

    // Only launch if it was a quick tap/click (drag distance < 8px), preserving OrbitControls rotation
    if (dx < 8 && dy < 8) {
      raycaster.setFromCamera(pointer, camera);
      const pos = camera.position.toArray() as [number, number, number];
      const speed = 42 * shotPower;

      if (activeWildcard === "triple") {
        const dirCenter = raycaster.ray.direction.clone();
        const dirLeft = dirCenter.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.12);
        const dirRight = dirCenter.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.12);

        if (!isMuted) playWebAudioSound("shoot");
        onShoot([
          { pos, vel: dirCenter.multiplyScalar(speed).toArray() as [number, number, number], type: "triple" },
          { pos, vel: dirLeft.multiplyScalar(speed).toArray() as [number, number, number], type: "triple" },
          { pos, vel: dirRight.multiplyScalar(speed).toArray() as [number, number, number], type: "triple" },
        ]);
      } else {
        const vel = raycaster.ray.direction.clone().multiplyScalar(speed).toArray() as [number, number, number];
        if (!isMuted) {
          if (activeWildcard === "bomb") playWebAudioSound("bomb");
          else if (activeWildcard === "heavy") playWebAudioSound("heavy");
          else playWebAudioSound("shoot");
        }
        onShoot([{ pos, vel, type: activeWildcard }]);
      }
    }
  };

  return (
    <mesh visible={false} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <planeGeometry args={[1000, 1000]} />
    </mesh>
  );
});

export default function SmashFestGame({
  levelId,
  activeWildcard = "standard",
  shotPower = 1.0,
  onMemoryBlockTriggered,
  onLevelCompleted,
  onOutOfAmmo,
  onStatsUpdate,
  isSoundMuted = false,
}: SmashFestGameProps) {
  const [level, setLevel] = useState<LevelSchema | null>(DEFAULT_LEVELS[levelId] || DEFAULT_LEVELS.level_1);
  const [projectiles, setProjectiles] = useState<{ id: number; pos: [number, number, number]; vel: [number, number, number]; type: WildcardType }[]>([]);
  const [projId, setProjId] = useState(0);
  const [triggeredMemoryIds, setTriggeredMemoryIds] = useState<Set<string>>(new Set());

  // Load level from Supabase or fallback gracefully to DEFAULT_LEVELS
  useEffect(() => {
    let isMounted = true;
    async function loadLevel() {
      try {
        const { data, error } = await supabase
          .from("smash_fest_levels")
          .select("*")
          .eq("level_id", levelId)
          .single();

        if (!error && data && isMounted) {
          setLevel(data as LevelSchema);
        } else if (isMounted) {
          setLevel(DEFAULT_LEVELS[levelId] || DEFAULT_LEVELS.level_1);
        }
      } catch (e) {
        if (isMounted) {
          setLevel(DEFAULT_LEVELS[levelId] || DEFAULT_LEVELS.level_1);
        }
      }
    }

    setProjectiles([]);
    setProjId(0);
    setTriggeredMemoryIds(new Set());
    loadLevel();

    return () => {
      isMounted = false;
    };
  }, [levelId]);

  const totalMemoryBlocks = level?.nodes.filter((n) => n.isMemoryBlock).length || 0;
  const hasCompletedLevelRef = useRef(false);
  const hasTriggeredOutOfAmmoRef = useRef(false);
  const lastStatsRef = useRef({ remainingBalls: -1, memoryBlocksLeft: -1, totalMemoryBlocks: -1 });

  // Reset flags when level changes
  useEffect(() => {
    hasCompletedLevelRef.current = false;
    hasTriggeredOutOfAmmoRef.current = false;
    lastStatsRef.current = { remainingBalls: -1, memoryBlocksLeft: -1, totalMemoryBlocks: -1 };
  }, [levelId]);

  const handleMemoryBlockTrigger = useCallback(
    (nodeId: string) => {
      setTriggeredMemoryIds((prev) => {
        const next = new Set(prev);
        next.add(nodeId);
        return next;
      });

      setTimeout(() => {
        if (onMemoryBlockTriggered) onMemoryBlockTriggered();
      }, 0);
    },
    [onMemoryBlockTriggered]
  );

  // Victory Level Completion Handler Effect
  useEffect(() => {
    if (
      totalMemoryBlocks > 0 &&
      triggeredMemoryIds.size >= totalMemoryBlocks &&
      !hasCompletedLevelRef.current
    ) {
      hasCompletedLevelRef.current = true;
      if (!isSoundMuted) playWebAudioSound("victory");
      const timer = setTimeout(() => {
        if (onLevelCompleted) onLevelCompleted();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [triggeredMemoryIds.size, totalMemoryBlocks, isSoundMuted, onLevelCompleted]);

  const handleShoot = (shots: { pos: [number, number, number]; vel: [number, number, number]; type: WildcardType }[]) => {
    if (!level) return;
    if (projectiles.length >= level.projectile_limit) return;

    setProjectiles((prev) => [
      ...prev,
      ...shots.map((s, i) => ({ id: projId + i, pos: s.pos, vel: s.vel, type: s.type })),
    ]);
    setProjId((p) => p + shots.length);
  };

  // Sync remaining stats safely without infinite re-render loops
  useEffect(() => {
    if (!level) return;
    const remainingBalls = Math.max(0, level.projectile_limit - projectiles.length);
    const memoryBlocksLeft = Math.max(0, totalMemoryBlocks - triggeredMemoryIds.size);

    if (
      lastStatsRef.current.remainingBalls !== remainingBalls ||
      lastStatsRef.current.memoryBlocksLeft !== memoryBlocksLeft ||
      lastStatsRef.current.totalMemoryBlocks !== totalMemoryBlocks
    ) {
      lastStatsRef.current = { remainingBalls, memoryBlocksLeft, totalMemoryBlocks };
      if (onStatsUpdate) {
        onStatsUpdate({ remainingBalls, memoryBlocksLeft, totalMemoryBlocks });
      }
    }

    if (remainingBalls <= 0 && memoryBlocksLeft > 0 && !hasTriggeredOutOfAmmoRef.current) {
      hasTriggeredOutOfAmmoRef.current = true;
      const timer = setTimeout(() => {
        if (onOutOfAmmo) onOutOfAmmo();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [projectiles.length, triggeredMemoryIds.size, totalMemoryBlocks, level, onStatsUpdate, onOutOfAmmo]);

  if (!level) return null;

  const trajectoryColor =
    activeWildcard === "bomb" ? "#ff003c" : activeWildcard === "heavy" ? "#a178ff" : activeWildcard === "triple" ? "#c3f400" : level.palette.projectile;

  return (
    <div className="w-full h-full relative z-0">
      <Canvas shadows camera={{ position: [0, 5, 12], fov: 50 }}>
        <color attach="background" args={[level.palette.background]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[12, 16, 8]} castShadow intensity={1.2} shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0, 8, 0]} intensity={0.8} color="#ff4b89" />

        <Physics gravity={[0, -9.81, 0]}>
          <Ground color={level.palette.ground} />

          {level.nodes.map((node) => {
            if (node.type === "box") {
              return (
                <BoxNode
                  key={node.id}
                  node={node}
                  isMuted={isSoundMuted}
                  onTrigger={() => handleMemoryBlockTrigger(node.id)}
                />
              );
            }
            if (node.type === "cylinder") {
              return (
                <CylinderNode
                  key={node.id}
                  node={node}
                  isMuted={isSoundMuted}
                  onTrigger={() => handleMemoryBlockTrigger(node.id)}
                />
              );
            }
            return null;
          })}

          {projectiles.map((p) => (
            <Projectile
              key={p.id}
              position={p.pos}
              velocity={p.vel}
              color={level.palette.projectile}
              type={p.type}
              isMuted={isSoundMuted}
            />
          ))}
        </Physics>

        <TrajectoryLine color={trajectoryColor} />
        <InteractionHandler
          onShoot={handleShoot}
          limit={level.projectile_limit}
          current={projectiles.length}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          isMuted={isSoundMuted}
        />
        <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
