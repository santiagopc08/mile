"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Creates a procedural peppermint swirl texture for candy can lids.
 */
function createPeppermintSwirlTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Base white/cream background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Draw 12 curved peppermint red wedges / pinwheel
  const wedges = 12;
  const step = (Math.PI * 2) / wedges;

  for (let i = 0; i < wedges; i += 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, i * step, (i + 1) * step);
    ctx.closePath();
    ctx.fillStyle = "#e11d48"; // Vivid crimson / strawberry red
    ctx.fill();
  }

  // Inner glossy ring
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "rgba(255,255,255,0.7)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.1)");
  grad.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a procedural striped candy wrapper texture.
 */
function createCandyStripeTexture(baseColor = "#e11d48"): THREE.CanvasTexture {
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Base glossy red/pink body
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Top and bottom white candy wrapper borders
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, 14);
  ctx.fillRect(0, height - 14, width, 14);

  // Subtle vertical stripe accents
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  const stripeCount = 8;
  const stripeW = width / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillRect(i * stripeW + stripeW * 0.25, 14, stripeW * 0.25, height - 28);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(2, 1);
  texture.needsUpdate = true;
  return texture;
}

interface CandyCylinderProps {
  radius?: number;
  height?: number;
  color?: string;
  isMemory?: boolean;
  photoUrl?: string;
}

/**
 * A juicy, candy-styled cylinder block with peppermint top cap and glossy finish.
 */
export function CandyCylinderMesh({
  radius = 0.45,
  height = 0.85,
  color = "#e11d48",
  isMemory = false,
  photoUrl,
}: CandyCylinderProps) {
  const swirlTexture = useMemo(() => createPeppermintSwirlTexture(), []);
  const stripeTexture = useMemo(() => createCandyStripeTexture(color), [color]);

  return (
    <group>
      {/* Cylinder Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 24]} />
        <meshStandardMaterial
          map={stripeTexture}
          color={color}
          roughness={0.18}
          metalness={0.15}
          emissive={isMemory ? "#ff4b89" : "#000000"}
          emissiveIntensity={isMemory ? 0.35 : 0}
        />
      </mesh>

      {/* Top Peppermint Swirl Lid */}
      <mesh position={[0, height / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[radius * 0.96, 24]} />
        <meshStandardMaterial
          map={swirlTexture}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Top Golden / White Bevel Ring */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 1.02, radius * 0.98, 0.04, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Bottom Ring */}
      <mesh position={[0, -height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 1.02, 0.04, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Memory Glow Halo if this is a couple memory block */}
      {isMemory && (
        <pointLight position={[0, 0, 0]} color="#ff4b89" intensity={1.5} distance={2.5} />
      )}
    </group>
  );
}
