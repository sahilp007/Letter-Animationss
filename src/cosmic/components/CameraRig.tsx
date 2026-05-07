import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Movement } from "../types";

interface Props {
  movement: Movement;
  cursor: { current: { x: number; y: number; energy: number } };
}

/**
 * Cinematic camera. Each movement has a target pose; the rig eases toward it. The cursor
 * adds a subtle parallax sway so the camera always feels alive. A slow ambient drift
 * (low-amplitude sine on each axis) keeps the frame from ever feeling locked.
 */
const POSES: Record<
  Movement,
  { pos: [number, number, number]; look: [number, number, number]; fov: number; roll?: number }
> = {
  opening: { pos: [0, 0, 14], look: [0, 0, 0], fov: 35, roll: 0 },
  lift: { pos: [0, 1.5, 24], look: [0, 0, 0], fov: 42, roll: 0.005 },
  galaxy: { pos: [0, 9, 42], look: [0, 0, 0], fov: 50, roll: 0.012 },
  conductor: { pos: [0, 4, 30], look: [0, 0, 0], fov: 54, roll: -0.008 },
  crescendo: { pos: [0, 0, 6], look: [0, 0, 0], fov: 44, roll: 0 },
  coda: { pos: [0, 0, 5], look: [0, 0, 0], fov: 38, roll: 0 },
  moment: { pos: [0, 0, 16], look: [0, 0, 0], fov: 38, roll: 0.006 },
};

export function CameraRig({ movement, cursor }: Props) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const rollRef = useRef(0);

  useFrame((state) => {
    const pose = POSES[movement];
    const t = state.clock.elapsedTime;

    /* Slow ambient drift — barely perceptible, but kills the "static" feel. */
    const driftX = Math.sin(t * 0.07) * 0.4;
    const driftY = Math.cos(t * 0.05) * 0.25;
    const driftZ = Math.sin(t * 0.045) * 0.3;
    targetPos.current.set(pose.pos[0] + driftX, pose.pos[1] + driftY, pose.pos[2] + driftZ);
    targetLook.current.set(...pose.look);

    /* Cursor parallax — subtle, scales with energy. */
    const sway = Math.min(1, 0.3 + cursor.current.energy * 0.7);
    targetPos.current.x += cursor.current.x * 1.4 * sway;
    targetPos.current.y += cursor.current.y * 0.7 * sway;

    camera.position.lerp(targetPos.current, 0.022);
    currentLook.current.lerp(targetLook.current, 0.04);
    camera.lookAt(currentLook.current);

    /* Subtle roll — applied AFTER lookAt to bias the up vector. */
    const targetRoll = pose.roll ?? 0;
    rollRef.current += (targetRoll - rollRef.current) * 0.04;
    camera.up.set(Math.sin(rollRef.current), Math.cos(rollRef.current), 0);

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov += (pose.fov - persp.fov) * 0.04;
      persp.updateProjectionMatrix();
    }
  });

  return null;
}
