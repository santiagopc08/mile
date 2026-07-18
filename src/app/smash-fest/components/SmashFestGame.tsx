"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics, useBox, useCylinder, usePlane, useSphere } from "@react-three/cannon";
import { Sky, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabaseClient";

interface LevelNode {
  id: string;
  type: "box" | "cylinder";
  dimensions: [number, number, number];
  position: [number, number, number];
  mass: number;
  friction: number;
  material: string;
  isMemoryBlock?: boolean;
}

interface LevelSchema {
  level_id: string;
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
}

// Plane
function Ground({ color }: { color: string }) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0] })) as any;
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Projectile
function Projectile({ position, velocity, color }: { position: [number, number, number]; velocity: [number, number, number]; color: string }) {
  const [ref] = useSphere(() => ({
    mass: 50, // Heavy projectile
    position,
    velocity,
    args: [0.3],
  })) as any;

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Level Nodes
function BoxNode({ node, onTrigger }: { node: LevelNode; onTrigger: () => void }) {
  const [ref, api] = useBox(() => ({
    mass: node.mass,
    position: node.position,
    args: node.dimensions,
    material: { friction: node.friction },
  })) as any;

  const position = useRef<[number, number, number]>([0,0,0]);

  useEffect(() => {
    const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
        position.current = v;
    });
    return unsubscribe;
  }, [api]);

  const hasTriggered = useRef(false);

  useFrame(() => {
      if (!hasTriggered.current && node.isMemoryBlock && position.current[1] < 1) { // Threshold for falling
          hasTriggered.current = true;
          onTrigger();
      }
  })

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={node.dimensions} />
      <meshStandardMaterial color={node.isMemoryBlock ? "gold" : "#a1a1aa"} />
    </mesh>
  );
}

function CylinderNode({ node, onTrigger }: { node: LevelNode; onTrigger: () => void }) {
    // Cannon-es uses [radiusTop, radiusBottom, height, numSegments]
    const args: [number, number, number, number] = [node.dimensions[0], node.dimensions[1], node.dimensions[2], 16];
    const [ref, api] = useCylinder(() => ({
      mass: node.mass,
      position: node.position,
      args,
      material: { friction: node.friction },
    })) as any;

    const position = useRef<[number, number, number]>([0,0,0]);

    useEffect(() => {
      const unsubscribe = api.position.subscribe((v: [number, number, number]) => {
          position.current = v;
      });
      return unsubscribe;
    }, [api]);

    const hasTriggered = useRef(false);

    useFrame(() => {
        if (!hasTriggered.current && node.isMemoryBlock && position.current[1] < 1) {
            hasTriggered.current = true;
            onTrigger();
        }
    })

    return (
      <mesh ref={ref} castShadow receiveShadow>
        <cylinderGeometry args={[node.dimensions[0], node.dimensions[1], node.dimensions[2], 32]} />
        <meshStandardMaterial color={node.isMemoryBlock ? "gold" : "#d4d4d8"} />
      </mesh>
    );
  }

// Interaction Layer (Raycasting)
function InteractionHandler({ onShoot, limit, current }: { onShoot: (options: { pos: [number, number, number]; vel: [number, number, number] }) => void; limit: number; current: number }) {
  const { camera, raycaster, pointer } = useThree();

  const handlePointerDown = () => {
      if (current >= limit) return;
    raycaster.setFromCamera(pointer, camera);
    const pos = camera.position.toArray() as [number, number, number];
    // Shoot forward along the ray direction
    const vel = raycaster.ray.direction.multiplyScalar(40).toArray() as [number, number, number];
    onShoot({ pos, vel });
  };

  return (
    <mesh visible={false} onPointerDown={handlePointerDown}>
      <planeGeometry args={[1000, 1000]} />
    </mesh>
  );
}

export default function SmashFestGame({ levelId, onMemoryBlockTriggered }: SmashFestGameProps) {
  const [level, setLevel] = useState<LevelSchema | null>(null);
  const [projectiles, setProjectiles] = useState<{ id: number; pos: [number, number, number]; vel: [number, number, number] }[]>([]);
  const [projId, setProjId] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLevel() {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("smash_fest_levels")
        .select("*")
        .eq("level_id", levelId)
        .single();

      if (error) {
        console.error("Failed to load level", error);
        setError(error.message);
      } else if (data) {
        setLevel(data as LevelSchema);
      }
      setIsLoading(false);
    }
    loadLevel();
  }, [levelId]);

  if (isLoading) {
    return <div className="flex w-full h-full items-center justify-center text-white">Loading Level Data...</div>;
  }

  if (error || !level) {
    return (
      <div className="flex w-full h-full flex-col items-center justify-center text-white text-center px-4">
        <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Level</h2>
        <p className="text-sm opacity-80">{error || "Level not found"}</p>
      </div>
    );
  }

  const handleShoot = ({ pos, vel }: { pos: [number, number, number]; vel: [number, number, number] }) => {
    setProjectiles((prev) => [...prev, { id: projId, pos, vel }]);
    setProjId((p) => p + 1);
  };

  return (
    <div className="w-full h-full relative z-0">
        <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full font-mono">
            Balls: {level.projectile_limit - projectiles.length}
        </div>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={[level.palette.background]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} castShadow intensity={1} shadow-mapSize={[1024, 1024]} />

        <Physics>
          <Ground color={level.palette.ground} />

          {level.nodes.map((node) => {
            if (node.type === "box") {
              return <BoxNode key={node.id} node={node} onTrigger={onMemoryBlockTriggered} />;
            }
            if (node.type === "cylinder") {
              return <CylinderNode key={node.id} node={node} onTrigger={onMemoryBlockTriggered} />;
            }
            return null;
          })}

          {projectiles.map((p) => (
            <Projectile key={p.id} position={p.pos} velocity={p.vel} color={level.palette.projectile} />
          ))}
        </Physics>

        <InteractionHandler onShoot={handleShoot} limit={level.projectile_limit} current={projectiles.length} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.1} />
      </Canvas>
    </div>
  );
}
