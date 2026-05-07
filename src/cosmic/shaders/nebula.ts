/**
 * Volumetric-feeling nebula rendered as a single fullscreen quad behind the galaxy.
 * Uses layered fbm noise + a warm/cool gradient that responds to overall intensity.
 */

export const NEBULA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.99, 1.0);
}
`;

export const NEBULA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uWarm;
uniform vec3 uCool;
uniform vec3 uDeep;
uniform float uAspect;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * vnoise(p);
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uAspect;
  vec2 p = uv * 1.6;
  float t = uTime * 0.012;

  float n1 = fbm(p + vec2(t, t * 0.7));
  float n2 = fbm(p * 1.7 - vec2(t * 0.6, -t * 0.4));
  float n = pow(mix(n1, n2, 0.55), 1.4);

  /* radial fade from center — keeps the dramatic vignette. */
  float r = length(vUv - vec2(0.5));
  float vignette = smoothstep(0.95, 0.2, r);

  vec3 base = mix(uDeep, uCool, n);
  base = mix(base, uWarm, smoothstep(0.55, 0.95, n) * 0.85);

  base *= vignette * (0.55 + 0.6 * uIntensity);
  gl_FragColor = vec4(base, 1.0);
}
`;
