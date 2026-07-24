"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics, useBox, useCylinder, usePlane, useSphere } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabaseClient";

export interface LevelNode {
  id: string;
  type: "box" | "cylinder";
  dimensions: [number, number, number];
  position: [number, number, number];
  mass: number;
  friction: number;
  material: string;
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
  onMemoryBlockTriggered: () => void;
  onLevelCompleted?: () => void;
  onOutOfAmmo?: () => void;
  onStatsUpdate?: (stats: { remainingBalls: number; memoryBlocksLeft: number; totalMemoryBlocks: number }) => void;
  isSoundMuted?: boolean;
}

// Built-in Default Level Data for Offline & Fallback Resilience
export const DEFAULT_LEVELS: Record<string, LevelSchema> = {
  level_1: {
    level_id: "level_1",
    name: "Torre Inicial",
    palette: {
      background: "#0c0a12",
      projectile: "#ff4b89",
      ground: "#1a1222",
    },
    projectile_limit: 8,
    nodes: [
      { id: "base1", type: "box", dimensions: [3, 0.8, 3], position: [0, 0.4, 0], mass: 60, friction: 0.6, material: "stone" },
      { id: "pillar1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, -1], mass: 12, friction: 0.5, material: "wood" },
      { id: "pillar2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, -1], mass: 12, friction: 0.5, material: "wood" },
      { id: "pillar3", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1, 1.8, 1], mass: 12, friction: 0.5, material: "wood" },
      { id: "pillar4", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1, 1.8, 1], mass: 12, friction: 0.5, material: "wood" },
      { id: "top1", type: "box", dimensions: [3, 0.5, 3], position: [0, 3.05, 0], mass: 20, friction: 0.5, material: "wood" },
      { id: "mem1", type: "box", dimensions: [1, 1, 1], position: [0, 4.0, 0], mass: 6, friction: 0.8, material: "special", isMemoryBlock: true },
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
      { id: "l_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [-2.5, 0.4, 0], mass: 50, friction: 0.6, material: "stone" },
      { id: "l_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-3.2, 1.9, 0], mass: 14, friction: 0.5, material: "wood" },
      { id: "l_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [-1.8, 1.9, 0], mass: 14, friction: 0.5, material: "wood" },
      { id: "l_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [-2.5, 3.25, 0], mass: 18, friction: 0.5, material: "wood" },
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-2.5, 4.1, 0], mass: 5, friction: 0.8, material: "special", isMemoryBlock: true },

      // Right Tower
      { id: "r_base", type: "box", dimensions: [2.2, 0.8, 2.2], position: [2.5, 0.4, 0], mass: 50, friction: 0.6, material: "stone" },
      { id: "r_pil1", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [1.8, 1.9, 0], mass: 14, friction: 0.5, material: "wood" },
      { id: "r_pil2", type: "cylinder", dimensions: [0.35, 0.35, 2.2], position: [3.2, 1.9, 0], mass: 14, friction: 0.5, material: "wood" },
      { id: "r_top", type: "box", dimensions: [2.2, 0.5, 2.2], position: [2.5, 3.25, 0], mass: 18, friction: 0.5, material: "wood" },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [2.5, 4.1, 0], mass: 5, friction: 0.8, material: "special", isMemoryBlock: true },

      // Connecting Bridge
      { id: "bridge", type: "box", dimensions: [3.5, 0.4, 1.5], position: [0, 3.4, 0], mass: 12, friction: 0.5, material: "wood" },
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
      { id: "b1", type: "box", dimensions: [1.8, 1.0, 1.8], position: [-1.8, 0.5, 0], mass: 45, friction: 0.6, material: "stone" },
      { id: "b2", type: "box", dimensions: [1.8, 1.0, 1.8], position: [0, 0.5, 0], mass: 45, friction: 0.6, material: "stone" },
      { id: "b3", type: "box", dimensions: [1.8, 1.0, 1.8], position: [1.8, 0.5, 0], mass: 45, friction: 0.6, material: "stone" },
      
      // Tier 2
      { id: "t2_p1", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [-1.2, 2.0, 0], mass: 15, friction: 0.5, material: "wood" },
      { id: "t2_p2", type: "cylinder", dimensions: [0.4, 0.4, 2], position: [1.2, 2.0, 0], mass: 15, friction: 0.5, material: "wood" },
      { id: "t2_slab", type: "box", dimensions: [4.5, 0.5, 2.0], position: [0, 3.25, 0], mass: 25, friction: 0.5, material: "wood" },

      // Memory Blocks Tier
      { id: "mem1", type: "box", dimensions: [0.9, 0.9, 0.9], position: [-1.5, 4.0, 0], mass: 5, friction: 0.8, material: "special", isMemoryBlock: true },
      { id: "mem2", type: "box", dimensions: [0.9, 0.9, 0.9], position: [0, 4.0, 0], mass: 5, friction: 0.8, material: "special", isMemoryBlock: true },
      { id: "mem3", type: "box", dimensions: [0.9, 0.9, 0.9], position: [1.5, 4.0, 0], mass: 5, friction: 0.8, material: "special", isMemoryBlock: true },
    ],
  },
};

// Web Audio API Sound Synthesizer
function playWebAudioSound(type: "shoot" | "hit" | "memory" | "victory") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "shoot") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
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
    } else if (type === "memory") {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.15, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.35);
      });
    } else if (type === "victory") {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.2, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.5);
      });
    }
  } catch (e) {
    // Ignore audio context autoplay restrictions gracefully
  }
}

// Ground Grid
function Ground({ color }: { color: string }) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0] })) as any;
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
    </mesh>
  );
}

// Projectile Ball
function Projectile({ position, velocity, color, isMuted }: { position: [number, number, number]; velocity: [number, number, number]; color: string; isMuted?: boolean }) {
  const [ref] = useSphere(() => ({
    mass: 55,
    position,
    velocity,
    args: [0.35],
    onCollide: () => {
      if (!isMuted) playWebAudioSound("hit");
    }
  })) as any;

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.1}
        metalness={0.8}
      />
      <pointLight color={color} intensity={1.5} distance={4} />
    </mesh>
  );
}

// Box Level Node
function BoxNode({ node, onTrigger, isMuted }: { node: LevelNode; onTrigger: () => void; isMuted?: boolean }) {
  const [ref, api] = useBox(() => ({
    mass: node.mass,
    position: node.position,
    args: node.dimensions,
    material: { friction: node.friction },
    onCollide: () => {
      if (!isMuted && !node.isMemoryBlock) playWebAudioSound("hit");
    }
  })) as any;

  const position = useRef<[number, number, number]>([0, 0, 0]);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
      position.current = v;
    });
    return unsubscribe;
  }, [api]);

  useFrame(() => {
    if (!hasTriggered.current && node.isMemoryBlock && position.current[1] < 1.2) {
      hasTriggered.current = true;
      if (!isMuted) playWebAudioSound("memory");
      onTrigger();
    }
  });

  const nodeColor = node.isMemoryBlock ? "#ff4b89" : node.material === "stone" ? "#382e39" : "#6e5a6a";

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={node.dimensions} />
      <meshStandardMaterial
        color={nodeColor}
        emissive={node.isMemoryBlock ? "#ff4b89" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.8 : 0}
        metalness={node.isMemoryBlock ? 0.9 : 0.3}
        roughness={node.isMemoryBlock ? 0.1 : 0.5}
      />
      {node.isMemoryBlock && <pointLight color="#ff4b89" intensity={2} distance={6} />}
    </mesh>
  );
}

// Cylinder Level Node
function CylinderNode({ node, onTrigger, isMuted }: { node: LevelNode; onTrigger: () => void; isMuted?: boolean }) {
  const args: [number, number, number, number] = [node.dimensions[0], node.dimensions[1], node.dimensions[2], 16];
  const [ref, api] = useCylinder(() => ({
    mass: node.mass,
    position: node.position,
    args,
    material: { friction: node.friction },
    onCollide: () => {
      if (!isMuted && !node.isMemoryBlock) playWebAudioSound("hit");
    }
  })) as any;

  const position = useRef<[number, number, number]>([0, 0, 0]);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
      position.current = v;
    });
    return unsubscribe;
  }, [api]);

  useFrame(() => {
    if (!hasTriggered.current && node.isMemoryBlock && position.current[1] < 1.2) {
      hasTriggered.current = true;
      if (!isMuted) playWebAudioSound("memory");
      onTrigger();
    }
  });

  const nodeColor = node.isMemoryBlock ? "#c3f400" : "#4a3c48";

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <cylinderGeometry args={[node.dimensions[0], node.dimensions[1], node.dimensions[2], 32]} />
      <meshStandardMaterial
        color={nodeColor}
        emissive={node.isMemoryBlock ? "#c3f400" : "#000000"}
        emissiveIntensity={node.isMemoryBlock ? 0.8 : 0}
        metalness={node.isMemoryBlock ? 0.9 : 0.3}
        roughness={node.isMemoryBlock ? 0.1 : 0.5}
      />
      {node.isMemoryBlock && <pointLight color="#c3f400" intensity={2} distance={6} />}
    </mesh>
  );
}

// Raycasting Pointer & Shoot Interaction Handler
function InteractionHandler({
  onShoot,
  limit,
  current,
  isMuted,
}: {
  onShoot: (options: { pos: [number, number, number]; vel: [number, number, number] }) => void;
  limit: number;
  current: number;
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
      const vel = raycaster.ray.direction.clone().multiplyScalar(42).toArray() as [number, number, number];
      if (!isMuted) playWebAudioSound("shoot");
      onShoot({ pos, vel });
    }
  };

  return (
    <mesh visible={false} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <planeGeometry args={[1000, 1000]} />
    </mesh>
  );
}

export default function SmashFestGame({
  levelId,
  onMemoryBlockTriggered,
  onLevelCompleted,
  onOutOfAmmo,
  onStatsUpdate,
  isSoundMuted = false,
}: SmashFestGameProps) {
  const [level, setLevel] = useState<LevelSchema | null>(DEFAULT_LEVELS[levelId] || DEFAULT_LEVELS.level_1);
  const [projectiles, setProjectiles] = useState<{ id: number; pos: [number, number, number]; vel: [number, number, number] }[]>([]);
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

  const handleMemoryBlockTrigger = useCallback((nodeId: string) => {
    setTriggeredMemoryIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      if (totalMemoryBlocks > 0 && next.size >= totalMemoryBlocks) {
        if (!isSoundMuted) playWebAudioSound("victory");
        if (onLevelCompleted) onLevelCompleted();
      }
      return next;
    });
    onMemoryBlockTriggered();
  }, [totalMemoryBlocks, onMemoryBlockTriggered, onLevelCompleted, isSoundMuted]);

  const handleShoot = ({ pos, vel }: { pos: [number, number, number]; vel: [number, number, number] }) => {
    if (!level) return;
    if (projectiles.length >= level.projectile_limit) return;

    setProjectiles((prev) => [...prev, { id: projId, pos, vel }]);
    setProjId((p) => p + 1);
  };

  // Sync remaining stats
  useEffect(() => {
    if (!level) return;
    const remainingBalls = level.projectile_limit - projectiles.length;
    const memoryBlocksLeft = totalMemoryBlocks - triggeredMemoryIds.size;
    if (onStatsUpdate) {
      onStatsUpdate({ remainingBalls, memoryBlocksLeft, totalMemoryBlocks });
    }

    if (remainingBalls <= 0 && memoryBlocksLeft > 0 && onOutOfAmmo) {
      const timer = setTimeout(() => {
        onOutOfAmmo();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [projectiles.length, triggeredMemoryIds.size, totalMemoryBlocks, level, onStatsUpdate, onOutOfAmmo]);

  if (!level) return null;

  return (
    <div className="w-full h-full relative z-0">
      <Canvas shadows camera={{ position: [0, 5, 11], fov: 50 }}>
        <color attach="background" args={[level.palette.background]} />
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[12, 16, 8]}
          castShadow
          intensity={1.2}
          shadow-mapSize={[1024, 1024]}
        />
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
              isMuted={isSoundMuted}
            />
          ))}
        </Physics>

        <InteractionHandler
          onShoot={handleShoot}
          limit={level.projectile_limit}
          current={projectiles.length}
          isMuted={isSoundMuted}
        />
        <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
