import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A sparse, distant starfield placed on a large sphere around the scene. These are NOT the
 * galaxy particles — they're the deep-background pinpoints that give the cosmos its sense
 * of infinity. Each star has its own twinkle phase + slight color variation.
 *
 * Cheap to render: ~600 points with a tiny shader.
 */

interface Props {
  count?: number;
  intensity: number;
}

const STAR_VERT = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
attribute float aSize;
attribute float aColor;
varying float vColor;
varying float vTwinkle;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 6.28);
  vTwinkle = tw;
  vColor = aColor;
  gl_PointSize = aSize * uPixelRatio * (180.0 / max(0.01, -mv.z));
}
`;

const STAR_FRAG = /* glsl */ `
uniform float uIntensity;
varying float vColor;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  if (d > 0.5) discard;
  float core = pow(1.0 - smoothstep(0.0, 0.5, d), 3.5);
  float halo = pow(max(0.0, 1.0 - d * 2.0), 2.0);

  /* Color: warm white -> cool white -> blue-white based on aColor. */
  vec3 warm = vec3(1.0, 0.95, 0.82);
  vec3 cool = vec3(0.78, 0.88, 1.0);
  vec3 col = mix(warm, cool, vColor);

  float a = (core * 0.95 + halo * 0.18) * vTwinkle * uIntensity;
  gl_FragColor = vec4(col, a);
}
`;

export function Starfield({ count = 700, intensity }: Props) {
  const ref = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      /* Distribute on a sphere of radius ~95 (well behind the galaxy at ~30). */
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 35;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      seeds[i] = Math.random();
      /* Most are small dust, a few are bright. */
      sizes[i] = Math.random() < 0.04 ? 1.6 + Math.random() * 1.6 : 0.4 + Math.random() * 0.6;
      colors[i] = Math.random();
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uPixelRatio: { value: window.devicePixelRatio || 1 },
      },
    });
    return { geometry: geom, material: mat };
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uIntensity.value += (intensity - material.uniforms.uIntensity.value) * 0.04;
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
