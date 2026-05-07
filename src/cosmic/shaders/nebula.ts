/**
 * Volumetric-feeling nebula on a fullscreen quad. Layered fbm noise + warm/cool gradient.
 * The deep tone is near-black to read as proper space rather than a tinted vignette.
 *
 * Two density layers — a cool wash and a warmer bloom that swims across it — give the
 * familiar Hubble-style "interstellar dust + ionized hydrogen" look. Subtle film-grain
 * noise is added at the end so the final image doesn't look digitally clean.
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
  for (int i = 0; i < 6; i++) {
    v += amp * vnoise(p);
    p = p * 2.07 + vec2(11.3, 7.7);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uAspect;

  float t = uTime * 0.008;

  /* Cool layer — broader, drifts slowly. */
  float n1 = fbm(uv * 1.4 + vec2(t * 1.2, t * 0.5));
  /* Warm layer — tighter, drifts the other way. */
  float n2 = fbm(uv * 2.6 - vec2(t * 0.7, -t * 0.4));
  /* Tendrils — high-frequency detail that breaks up flat regions. */
  float n3 = fbm(uv * 4.4 + vec2(-t, t * 0.8));

  float coolMass = pow(smoothstep(0.25, 0.85, n1), 1.6);
  float warmMass = pow(smoothstep(0.45, 0.92, n2 * 0.6 + n3 * 0.4), 1.4);

  /* Radial soft vignette pulling the eye to center, never harsh. */
  vec2 r2 = vUv - vec2(0.5);
  r2.x *= uAspect / max(uAspect, 1.0);
  float r = length(r2);
  float vignette = smoothstep(0.95, 0.18, r);

  /* Compose. Start from the deep void and add color in proportion to mass. */
  vec3 col = uDeep;
  col = mix(col, uCool, coolMass * 0.85);
  col = mix(col, uWarm, warmMass * 0.95);

  /* A faint ambient lift in the very deepest regions so it never reads as pure black. */
  col += uDeep * 0.5;

  col *= vignette * (0.55 + 0.7 * uIntensity);

  /* Subtle film grain — tied to time so it shifts. */
  float grain = (hash(vUv * vec2(1920.0, 1080.0) + vec2(uTime * 13.0, uTime * 7.0)) - 0.5) * 0.018;
  col += vec3(grain);

  gl_FragColor = vec4(col, 1.0);
}
`;
