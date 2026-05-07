import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { MemoryStar as MemoryStarData } from "../types";

interface Props {
  data: MemoryStarData;
  visited: boolean;
  onVisit: (star: MemoryStarData) => void;
}

/**
 * A memory star — a bright bloom hovering at a fixed position. When the camera (cursor target)
 * gets near, it pulses; clicking visits it (plays the voice clip + caption fades in).
 */
export function MemoryStarComp({ data, visited, onVisit }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const { camera } = useThree();
  const phase = useRef(Math.random() * Math.PI * 2);
  const captionVisible = visited;

  useEffect(() => {
    phase.current = Math.random() * Math.PI * 2;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const dist = camera.position.distanceTo(groupRef.current.position);
    const proximity = Math.max(0, 1 - dist / 18);
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.2 + phase.current);
    const scale = (visited ? 1.6 : 1.0) * (1 + proximity * 0.4) * pulse * (hover ? 1.25 : 1);
    groupRef.current.scale.setScalar(scale);
    if (haloRef.current) {
      const haloMat = haloRef.current.material as THREE.MeshBasicMaterial;
      haloMat.opacity = 0.18 + proximity * 0.4 + (hover ? 0.2 : 0);
    }
  });

  return (
    <group
      ref={groupRef}
      position={data.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onVisit(data);
      }}
    >
      {/* Core bloom — additive sprite. */}
      <mesh>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color(...data.color)} transparent opacity={1} toneMapped={false} />
      </mesh>
      {/* Halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.2, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color(...data.color)} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {captionVisible && data.caption && (
        <Billboard position={[0, 1.6, 0]}>
          <Text
            font="https://fonts.gstatic.com/s/bethellen/v18/WwkbxPW1E165rajQKDulIIcoVQ.woff2"
            fontSize={0.95}
            anchorX="center"
            anchorY="middle"
            color="#fff5e6"
            outlineWidth={0.02}
            outlineColor="#000"
            outlineOpacity={0.4}
          >
            {data.caption}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
