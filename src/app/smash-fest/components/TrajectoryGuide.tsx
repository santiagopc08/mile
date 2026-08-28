"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface TrajectoryGuideProps {
  origin?: [number, number, number];
  aimNdc?: { x: number; y: number; visible: boolean };
  shotSpeed?: number;
  gravity?: number;
  color?: string;
}

const POINT_COUNT = 24;
const TIME_STEP = 0.045;

/**
 * 3D Parabolic Ballistic Trajectory Guide with glowing dotted beads and impact target ring.
 */
export function TrajectoryGuide({
  origin = [0, 1.2, 6.2],
  aimNdc,
  shotSpeed = 28,
  gravity = 9.81,
  color = "#facc15",
}: TrajectoryGuideProps) {
  const { camera } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const targetRingRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ raycaster, pointer, clock }) => {
    const isVisible = aimNdc ? aimNdc.visible : true;
    if (!isVisible || !instancedMeshRef.current) {
      if (instancedMeshRef.current) instancedMeshRef.current.visible = false;
      if (targetRingRef.current) targetRingRef.current.visible = false;
      return;
    }

    instancedMeshRef.current.visible = true;

    // 1. Calculate firing direction from NDC
    const targetNdc = aimNdc ? aimNdc : pointer;
    raycaster.setFromCamera(new THREE.Vector2(targetNdc.x, targetNdc.y), camera);

    const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetHit = new THREE.Vector3();
    raycaster.ray.intersectPlane(targetPlane, targetHit);

    const startPos = new THREE.Vector3(...origin);
    let fireDir = new THREE.Vector3(0, 0, -1);

    if (targetHit) {
      fireDir = targetHit.clone().sub(startPos).normalize();
    }

    const vx = fireDir.x * shotSpeed;
    const vy = fireDir.y * shotSpeed;
    const vz = fireDir.z * shotSpeed;

    // 2. Compute ballistic points
    let impactPoint: THREE.Vector3 | null = null;

    for (let i = 0; i < POINT_COUNT; i++) {
      const t = (i + 1) * TIME_STEP;
      const px = startPos.x + vx * t;
      const py = startPos.y + vy * t - 0.5 * gravity * t * t;
      const pz = startPos.z + vz * t;

      dummy.position.set(px, py, pz);

      // Scale beads smaller along trajectory
      const beadScale = THREE.MathUtils.lerp(0.16, 0.05, i / POINT_COUNT);
      dummy.scale.setScalar(beadScale);
      dummy.updateMatrix();

      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Detect ground or target plane hit
      if (!impactPoint && (pz <= 0 || py <= 0.2)) {
        impactPoint = new THREE.Vector3(px, py, pz);
      }
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;

    // 3. Position animated impact reticle
    if (targetRingRef.current && impactPoint) {
      targetRingRef.current.visible = true;
      targetRingRef.current.position.copy(impactPoint);
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 8) * 0.15;
      targetRingRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group>
      {/* Instanced Glowing Dotted Beads */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, POINT_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </instancedMesh>

      {/* Target Impact Reticle Ring */}
      <mesh ref={targetRingRef} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <ringGeometry args={[0.3, 0.45, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
