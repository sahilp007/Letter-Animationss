import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GALAXY_VERT, GALAXY_FRAG } from "../shaders/galaxy";

interface Props {
  count?: number;
  /** 0 = chaotic cloud, 1 = formed galaxy. Animates between movements. */
  form: number;
  /** 0 = expanded, 1 = collapsed to single point. Drives the climax. */
  collapse: number;
  /** 0..1, drives bloom & sprite size. */
  intensity: number;
  warm?: [number, number, number];
  cool?: [number, number, number];
}

export function ParticleField({
  count = 9000,
  form,
  collapse,
  intensity,
  warm = [1.0, 0.85, 0.6],
  cool = [0.55, 0.65, 1.0],
}: Props) {
  const ref = useRef<THREE.Points>(null);
  const { gl } = useThree();

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const heights = new Float32Array(count);
    const sizes = new Float32Array(count);
    const chaos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 1.7) * 30 + 1.5;
      const a = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 4 * (1 - r / 32);
      seeds[i] = Math.random();
      radii[i] = r;
      angles[i] = a;
      heights[i] = h;
      sizes[i] = 0.7 + Math.random() * 1.6;
      chaos[i * 3] = (Math.random() - 0.5) * 80;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      /* base position (overwritten by shader, but the buffer must exist) */
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geom.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    geom.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    geom.setAttribute("aHeight", new THREE.BufferAttribute(heights, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aChaos", new THREE.BufferAttribute(chaos, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERT,
      fragmentShader: GALAXY_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uForm: { value: form },
        uCollapse: { value: collapse },
        uPixelRatio: { value: gl.getPixelRatio() },
        uIntensity: { value: intensity },
        uColorWarm: { value: new THREE.Vector3(...warm) },
        uColorCool: { value: new THREE.Vector3(...cool) },
      },
    });
    return { geometry: geom, material: mat };
  }, [count, gl]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    /* Smoothly interpolate uniforms toward props for elegant transitions. */
    const u = material.uniforms;
    u.uForm.value += (form - u.uForm.value) * 0.03;
    u.uCollapse.value += (collapse - u.uCollapse.value) * 0.04;
    u.uIntensity.value += (intensity - u.uIntensity.value) * 0.04;
    (u.uColorWarm.value as THREE.Vector3).set(...warm);
    (u.uColorCool.value as THREE.Vector3).set(...cool);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
