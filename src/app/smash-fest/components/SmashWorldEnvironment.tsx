"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural texture helper for cartoon grass, sand patch, and sky gradient.
 */
function createRadialSandTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Smooth circular sand patch with warm gradient and soft feathering edge
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.15,
    size / 2,
    size / 2,
    size * 0.48
  );
  gradient.addColorStop(0, "#f4c430"); // Warm golden sand center
  gradient.addColorStop(0.5, "#e5b128");
  gradient.addColorStop(0.85, "#c4951b");
  gradient.addColorStop(1, "rgba(85, 140, 35, 0)"); // Fades into surrounding green grass

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Subtle sand speckles
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Cartoon 3D Cloud made of merged glowing fluffy spheres.
 */
function Cloud({ position, scale = 1, speed = 0.2 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const initialX = position[0];

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.x += speed * delta;
      if (ref.current.position.x > initialX + 35) {
        ref.current.position.x = initialX - 35;
      }
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0, 0]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} emissive="#f8fbff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-1.4, -0.3, 0.2]} scale={0.75}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[1.4, -0.2, -0.1]} scale={0.8}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0.6, 0.8, -0.2]} scale={0.65}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[-0.7, 0.7, 0.1]} scale={0.6}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
    </group>
  );
}

/**
 * Distant Stylized Lighthouse on a coastal hill.
 */
function CoastalLighthouse({ position = [22, 5, -35] }: { position?: [number, number, number] }) {
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime() * 1.5;
      beaconRef.current.intensity = 1.8 + Math.sin(t * 3) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Green Coastal Cliff/Hill */}
      <mesh position={[0, -2, 0]} scale={[14, 8, 12]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#559928" roughness={0.8} />
      </mesh>

      {/* Sandy Shore under Cliff */}
      <mesh position={[0, -5.5, 3]} scale={[16, 2, 14]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#d4a340" roughness={0.9} />
      </mesh>

      {/* Lighthouse Base */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[1.2, 1.8, 6, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Red Stripes */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[1.5, 1.6, 1.5, 16]} />
        <meshStandardMaterial color="#e11d48" roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 1.5, 16]} />
        <meshStandardMaterial color="#e11d48" roughness={0.4} />
      </mesh>

      {/* Lantern Gallery / Balcony */}
      <mesh position={[0, 6.2, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.4, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Lantern Glass Room */}
      <mesh position={[0, 7.2, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 1.6, 16]} />
        <meshStandardMaterial color="#fef08a" roughness={0.1} transparent opacity={0.85} emissive="#fde047" emissiveIntensity={0.6} />
      </mesh>

      {/* Roof Dome & Finial */}
      <mesh position={[0, 8.4, 0]}>
        <coneGeometry args={[1.2, 1.2, 16]} />
        <meshStandardMaterial color="#be123c" roughness={0.3} />
      </mesh>

      {/* Lighthouse Light Beacon */}
      <pointLight ref={beaconRef} position={[0, 7.2, 0]} color="#fef08a" intensity={2.0} distance={40} />

      {/* Palm Trees */}
      <group position={[-5, 0.5, 3]}>
        <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.15, 0.25, 3.6, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        <mesh position={[0.3, 3.6, 0]} scale={[1.8, 0.6, 1.8]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#22c55e" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Animated Sparkling Ocean Shoreline in the background.
 */
function OceanShoreline() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.position.y = -3.2 + Math.sin(t * 1.2) * 0.08;
    }
  });

  return (
    <group position={[0, 0, -42]}>
      {/* Ocean Water Plane */}
      <mesh ref={meshRef} position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 40, 16, 16]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.1}
          metalness={0.2}
          emissive="#0891b2"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Shore Foam / Waves */}
      <mesh position={[0, -3.1, 18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 2]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.65} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Stylized Circus / Carnival Pedestal Stand where targets rest.
 */
export function CarnivalPedestal({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Golden Base Dome */}
      <mesh position={[0, -0.6, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.8, 2.4, 0.8, 24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Decorative Base Ring (Purple & Gold Pattern) */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.3, 24]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Central Golden Pillar / Stem */}
      <mesh position={[0, 1.4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.45, 0.65, 2.8, 24]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* Upper Collar Ring */}
      <mesh position={[0, 2.6, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.4, 0.8, 0.5, 24]} />
        <meshStandardMaterial color="#9333ea" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Top Target Table / Stage Platform */}
      <mesh position={[0, 2.95, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.4, 4.2]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Top Golden Rim Bevel */}
      <mesh position={[0, 3.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.3, 0.08, 4.3]} />
        <meshStandardMaterial color="#facc15" roughness={0.2} metalness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Full Stylized 3D World Environment.
 */
export function SmashWorldEnvironment() {
  const sandTexture = useMemo(() => createRadialSandTexture(), []);

  return (
    <group>
      {/* ── AMBIENT & DIRECTIONAL SUN LIGHTING ──────────────────────────── */}
      <ambientLight intensity={1.35} color="#e0f2fe" />
      <hemisphereLight args={["#bae6fd", "#4ade80", 0.95]} />
      <directionalLight
        position={[14, 28, 18]}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
        color="#fffbeb"
      />

      {/* Secondary Soft Fill Light */}
      <directionalLight position={[-16, 12, 10]} intensity={0.65} color="#ec4899" />

      {/* ── SKY DOME & BACKGROUND ───────────────────────────────────────── */}
      {/* Vibrant Blue Sky Half-Sphere */}
      <mesh position={[0, 0, -25]} scale={[120, 120, 120]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.BackSide} />
      </mesh>

      {/* Floating Animated Cartoon Clouds */}
      <Cloud position={[-18, 22, -28]} scale={1.8} speed={0.4} />
      <Cloud position={[12, 26, -32]} scale={2.2} speed={0.3} />
      <Cloud position={[-6, 17, -22]} scale={1.4} speed={0.5} />
      <Cloud position={[24, 19, -26]} scale={1.6} speed={0.35} />

      {/* ── DISTANT COASTLINE & LIGHTHOUSE ─────────────────────────────── */}
      <CoastalLighthouse position={[20, 4, -36]} />
      <OceanShoreline />

      {/* Rolling Green Meadow Hills in midground */}
      <mesh position={[-24, -3, -34]} scale={[26, 10, 18]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#4ade80" roughness={0.8} />
      </mesh>
      <mesh position={[0, -5, -38]} scale={[38, 11, 20]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>

      {/* ── FOREGROUND GRASS & CIRCULAR SAND ARENA ──────────────────────── */}
      {/* Main Endless Meadow Grass Plane */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#65a30d" roughness={0.75} />
      </mesh>

      {/* Circular Sandy Target Arena Patch */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          map={sandTexture}
          transparent
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Circus Pedestal */}
      <CarnivalPedestal position={[0, 0, 0]} />
    </group>
  );
}
