/**
 * GLSL shaders for the GPU particle galaxy. The vertex shader places points in a swirl with
 * per-point seeds; the fragment shader renders soft circular sprites with a warm core.
 *
 * Uniforms:
 *   uTime          — seconds, drives swirl rotation
 *   uForm          — 0..1 morph weight: 0 = chaos cloud (pre-galaxy), 1 = formed galaxy
 *   uCollapse      — 0..1 collapse weight for the climax: 0 = expanded, 1 = single point
 *   uPixelRatio    — device pixel ratio
 *   uIntensity     — 0..1 brightness multiplier (drives the overall bloom)
 *   uColorWarm     — base warm color (vec3)
 *   uColorCool     — base cool color (vec3)
 */

export const GALAXY_VERT = /* glsl */ `
uniform float uTime;
uniform float uForm;
uniform float uCollapse;
uniform float uPixelRatio;
uniform float uIntensity;

attribute float aSeed;
attribute float aRadius;
attribute float aAngle;
attribute float aHeight;
attribute float aSize;
attribute vec3 aChaos;

varying float vSeed;
varying float vRadial;

void main() {
  vSeed = aSeed;

  /* Galaxy form — a flattened spiral. */
  float swirl = aAngle + uTime * 0.04 + aRadius * 0.18;
  vec3 formed = vec3(
    cos(swirl) * aRadius,
    aHeight * (0.4 + 0.3 * sin(aAngle * 2.0)),
    sin(swirl) * aRadius
  );

  /* Mix between chaos cloud and formed galaxy. */
  vec3 pos = mix(aChaos, formed, uForm);

  /* Collapse toward origin for the climax. */
  pos = mix(pos, vec3(0.0), uCollapse * uCollapse);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = aSize * (200.0 / max(0.01, -mv.z)) * uPixelRatio;
  size *= mix(1.4, 0.7, uCollapse);
  size *= (0.7 + 0.6 * uIntensity);
  gl_PointSize = clamp(size, 1.0, 80.0);

  vRadial = aRadius / 30.0;
}
`;

export const GALAXY_FRAG = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColorWarm;
uniform vec3 uColorCool;

varying float vSeed;
varying float vRadial;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float halo = pow(1.0 - d * 2.0, 2.0);

  vec3 col = mix(uColorWarm, uColorCool, smoothstep(0.0, 1.2, vRadial));
  col += vec3(1.0, 0.95, 0.85) * pow(core, 4.0);

  float alpha = (core * 0.85 + halo * 0.15) * (0.55 + 0.45 * uIntensity);
  gl_FragColor = vec4(col * (0.55 + 0.45 * uIntensity), alpha);
}
`;
