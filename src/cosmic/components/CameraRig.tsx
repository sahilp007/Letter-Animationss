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
 * adds a subtle parallax sway so the camera always feels alive.
 */
const POSES: Record<Movement, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  opening: { pos: [0, 0, 14], look: [0, 0, 0], fov: 35 },
  lift: { pos: [0, 1, 22], look: [0, 0, 0], fov: 42 },
  galaxy: { pos: [0, 8, 38], look: [0, 0, 0], fov: 48 },
  conductor: { pos: [0, 4, 28], look: [0, 0, 0], fov: 52 },
  crescendo: { pos: [0, 0, 8], look: [0, 0, 0], fov: 44 },
  coda: { pos: [0, 0, 5], look: [0, 0, 0], fov: 38 },
  moment: { pos: [0, 0, 18], look: [0, 0, 0], fov: 38 },
};

export function CameraRig({ movement, cursor }: Props) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const pose = POSES[movement];
    targetPos.current.set(...pose.pos);
    targetLook.current.set(...pose.look);

    /* Cursor parallax — subtle, never aggressive. */
    const sway = Math.min(1, 0.3 + cursor.current.energy * 0.7);
    targetPos.current.x += cursor.current.x * 1.2 * sway;
    targetPos.current.y += cursor.current.y * 0.6 * sway;

    camera.position.lerp(targetPos.current, 0.025);
    currentLook.current.lerp(targetLook.current, 0.04);
    camera.lookAt(currentLook.current);

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov += (pose.fov - persp.fov) * 0.04;
      persp.updateProjectionMatrix();
    }
  });

  return null;
}
