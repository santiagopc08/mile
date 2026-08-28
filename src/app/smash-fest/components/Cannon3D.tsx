"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface Cannon3DHandle {
  fire: () => void;
}

interface Cannon3DProps {
  aimNdc?: { ndc: THREE.Vector2; visible: boolean } | { x: number; y: number; visible: boolean };
  position?: [number, number, number];
}

/**
 * 3D Interactive Toy / Circus Cannon with smooth aiming, spring recoil kickback,
 * and muzzle flash particle effects.
 */
export const Cannon3D = forwardRef<Cannon3DHandle, Cannon3DProps>(function Cannon3D(
  { aimNdc, position = [0, 0.4, 7.8] },
  ref
) {
  const { camera } = useThree();
  const cannonGroupRef = useRef<THREE.Group>(null);
  const yawGroupRef = useRef<THREE.Group>(null);
  const pitchGroupRef = useRef<THREE.Group>(null);
  const barrelRecoilRef = useRef<THREE.Group>(null);
  const muzzleFlashLightRef = useRef<THREE.PointLight>(null);
  const muzzleFlashMeshRef = useRef<THREE.Mesh>(null);

  // Recoil spring state
  const recoilSpring = useRef({
    currentOffset: 0,
    targetOffset: 0,
    velocity: 0,
    flashIntensity: 0,
  });

  useImperativeHandle(ref, () => ({
    fire() {
      // Trigger strong recoil kickback
      recoilSpring.current.currentOffset = -0.55;
      recoilSpring.current.velocity = -4.0;
      recoilSpring.current.flashIntensity = 1.0;
    },
  }));

  useFrame(({ raycaster, pointer }, delta) => {
    // ── 1. AIM TRACKING ─────────────────────────────────────────────────────
    if (yawGroupRef.current && pitchGroupRef.current) {
      // Use aim NDC or active pointer
      let nx = pointer.x;
      let ny = pointer.y;

      if (aimNdc) {
        if ("ndc" in aimNdc && aimNdc.visible) {
          nx = aimNdc.ndc.x;
          ny = aimNdc.ndc.y;
        } else if ("x" in aimNdc && aimNdc.visible) {
          nx = aimNdc.x;
          ny = aimNdc.y;
        }
      }

      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);

      // Raycast to target depth plane (z = 0)
      const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const targetPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(targetPlane, targetPoint);

      if (targetPoint) {
        // Calculate horizontal angle (yaw)
        const cannonPos = new THREE.Vector3(...position);
        const dx = targetPoint.x - cannonPos.x;
        const dz = targetPoint.z - cannonPos.z;
        const targetYaw = Math.atan2(dx, -dz);

        // Calculate vertical pitch angle
        const dy = targetPoint.y - cannonPos.y;
        const distHorizontal = Math.hypot(dx, dz);
        const targetPitch = Math.atan2(dy, distHorizontal);

        // Smoothly lerp angles
        yawGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          yawGroupRef.current.rotation.y,
          targetYaw,
          Math.min(1, delta * 14)
        );

        pitchGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          pitchGroupRef.current.rotation.x,
          -targetPitch + 0.1, // Slight upward muzzle angle
          Math.min(1, delta * 14)
        );
      }
    }

    // ── 2. SPRING-BASED RECOIL ANIMATION ────────────────────────────────────
    if (barrelRecoilRef.current) {
      const s = recoilSpring.current;
      const stiffness = 220;
      const damping = 16;

      const displacement = s.currentOffset - s.targetOffset;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * s.velocity;
      const acceleration = springForce + dampingForce;

      s.velocity += acceleration * delta;
      s.currentOffset += s.velocity * delta;

      // Apply recoil along barrel local Z
      barrelRecoilRef.current.position.z = s.currentOffset;

      // Slight squash & stretch on kickback
      const squash = 1 - Math.abs(s.currentOffset) * 0.25;
      barrelRecoilRef.current.scale.set(1 / squash, 1 / squash, squash);

      // Fade muzzle flash
      if (s.flashIntensity > 0) {
        s.flashIntensity = Math.max(0, s.flashIntensity - delta * 9);
        if (muzzleFlashLightRef.current) {
          muzzleFlashLightRef.current.intensity = s.flashIntensity * 4.5;
        }
        if (muzzleFlashMeshRef.current) {
          muzzleFlashMeshRef.current.scale.setScalar(s.flashIntensity * 1.6);
          (muzzleFlashMeshRef.current.material as THREE.MeshBasicMaterial).opacity = s.flashIntensity;
        }
      }
    }
  });

  return (
    <group ref={cannonGroupRef} position={position} scale={1.2}>
      {/* ── BASE CAROUSEL RING & MOUNT ─────────────────────────────────── */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.25, 24]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.15, 24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* ── YAW ROTATION GROUP (HORIZONTAL SWIVEL) ─────────────────────── */}
      <group ref={yawGroupRef}>
        {/* Blue U-Mount Brackets */}
        <mesh position={[-0.75, 0.25, 0]} castShadow>
          <boxGeometry args={[0.25, 0.8, 0.5]} />
          <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.75, 0.25, 0]} castShadow>
          <boxGeometry args={[0.25, 0.8, 0.5]} />
          <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* ── PITCH ROTATION GROUP (VERTICAL ELEVATION) ────────────────── */}
        <group ref={pitchGroupRef} position={[0, 0.35, 0]}>
          {/* Trunnions / Pivot Pins */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 1.7, 16]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.6} />
          </mesh>

          {/* ── RECOIL SPRING CONTAINER ────────────────────────────────── */}
          <group ref={barrelRecoilRef}>
            {/* Breech Spherical Cap at Back */}
            <mesh position={[0, 0, 0.6]} castShadow>
              <sphereGeometry args={[0.62, 20, 20]} />
              <meshStandardMaterial color="#1d4ed8" roughness={0.25} metalness={0.2} />
            </mesh>

            {/* Rear Golden Pin */}
            <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.18, 0.35, 12]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.7} />
            </mesh>

            {/* Middle Blue Barrel Segment */}
            <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.6, 0.8, 20]} />
              <meshStandardMaterial color="#2563eb" roughness={0.25} metalness={0.2} />
            </mesh>

            {/* Golden Decorative Ring Band */}
            <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.58, 0.58, 0.16, 20]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.6} />
            </mesh>

            {/* Red Tapered Forward Barrel */}
            <mesh position={[0, 0, -0.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.48, 0.54, 0.9, 20]} />
              <meshStandardMaterial color="#e11d48" roughness={0.3} metalness={0.15} />
            </mesh>

            {/* Front Wide Golden Muzzle Crown */}
            <mesh position={[0, 0, -1.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.62, 0.5, 0.3, 20]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.6} />
            </mesh>

            {/* Inner Dark Bore Hole */}
            <mesh position={[0, 0, -1.48]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.42, 20]} />
              <meshBasicMaterial color="#050505" />
            </mesh>

            {/* ── MUZZLE FLASH PARTICLES & LIGHT ───────────────────────── */}
            <pointLight
              ref={muzzleFlashLightRef}
              position={[0, 0, -1.6]}
              color="#fbbf24"
              intensity={0}
              distance={12}
            />

            <mesh ref={muzzleFlashMeshRef} position={[0, 0, -1.6]} scale={0}>
              <sphereGeometry args={[0.45, 12, 12]} />
              <meshBasicMaterial color="#fef08a" transparent opacity={0} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});
