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

    const colorMix = new Float32Array(count);
    const tiers = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      /* Concentrated toward galactic center, with a long thin tail. */
      const r = Math.pow(Math.random(), 1.85) * 32 + 1.2;
      const a = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 3.6 * (1 - Math.min(1, r / 32));
      seeds[i] = Math.random();
      radii[i] = r;
      angles[i] = a;
      heights[i] = h;

      /* Tier distribution: most are dust (tier 0), some mid-stars (tier 1), few bright (tier 2). */
      const tierRoll = Math.random();
      const tier = tierRoll > 0.985 ? 2 : tierRoll > 0.86 ? 1 : 0;
      tiers[i] = tier;
      sizes[i] = tier === 2 ? 1.6 + Math.random() * 1.4 : tier === 1 ? 0.9 + Math.random() * 0.7 : 0.4 + Math.random() * 0.5;

      /* Color mix biased to warm at galactic center, cool at the edges. */
      colorMix[i] = Math.min(1, Math.max(0, r / 30 + (Math.random() - 0.5) * 0.45));

      chaos[i * 3] = (Math.random() - 0.5) * 90;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 90;
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
    geom.setAttribute("aColorMix", new THREE.BufferAttribute(colorMix, 1));
    geom.setAttribute("aTier", new THREE.BufferAttribute(tiers, 1));

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
