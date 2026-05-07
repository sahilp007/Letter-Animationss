import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NEBULA_FRAG, NEBULA_VERT } from "../shaders/nebula";

interface Props {
  intensity: number;
  warm?: [number, number, number];
  cool?: [number, number, number];
  deep?: [number, number, number];
}

export function Nebula({ intensity, warm = [1.0, 0.72, 0.45], cool = [0.5, 0.42, 0.85], deep = [0.04, 0.02, 0.08] }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uWarm: { value: new THREE.Vector3(...warm) },
          uCool: { value: new THREE.Vector3(...cool) },
          uDeep: { value: new THREE.Vector3(...deep) },
          uAspect: { value: size.width / size.height },
        },
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uIntensity.value += (intensity - mat.uniforms.uIntensity.value) * 0.04;
    (mat.uniforms.uWarm.value as THREE.Vector3).set(...warm);
    (mat.uniforms.uCool.value as THREE.Vector3).set(...cool);
    (mat.uniforms.uDeep.value as THREE.Vector3).set(...deep);
    mat.uniforms.uAspect.value = state.size.width / state.size.height;
  });

  return (
    <mesh ref={meshRef} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
