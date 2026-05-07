/**
 * GLSL shaders for the GPU particle galaxy. The vertex shader places points in a swirl with
 * per-point seeds; the fragment shader renders soft circular sprites with a warm core, a
 * sharp pin-prick highlight, and twinkle so the field reads as real stars rather than a
 * uniform sprite cloud.
 *
 * Per-particle attributes:
 *   aSeed     — random 0..1, drives twinkle phase + color category
 *   aRadius   — distance from galaxy center (after formation)
 *   aAngle    — angle around galaxy
 *   aHeight   — vertical scatter
 *   aSize     — per-point sprite size multiplier
 *   aChaos    — vec3 chaos position (pre-formation)
 *   aColorMix — 0..1 blend between warm/cool; can be biased to white for "hot stars"
 *   aTier     — 0 = dust (small), 1 = mid, 2 = bright nucleus stars
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
attribute float aColorMix;
attribute float aTier;

varying float vSeed;
varying float vRadial;
varying float vColorMix;
varying float vTier;
varying float vTwinkle;

void main() {
  vSeed = aSeed;
  vColorMix = aColorMix;
  vTier = aTier;

  /* Galaxy form — a flattened spiral with subtle arm structure. */
  float arm = aAngle * 2.0;
  float armOffset = sin(arm + aRadius * 0.25) * 0.6;
  float swirl = aAngle + uTime * (0.025 + aTier * 0.01) + aRadius * 0.12 + armOffset * 0.1;
  vec3 formed = vec3(
    cos(swirl) * aRadius,
    aHeight * (0.35 + 0.25 * sin(aAngle * 2.0 + aSeed * 6.28)),
    sin(swirl) * aRadius
  );

  /* Mix between chaos cloud and formed galaxy. */
  vec3 pos = mix(aChaos, formed, uForm);

  /* Collapse toward origin for the climax. */
  pos = mix(pos, vec3(0.0), uCollapse * uCollapse);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  /* Twinkle — each point has its own slow alpha modulation. */
  float twPhase = aSeed * 6.2831 + uTime * (1.4 + aSeed * 1.6);
  vTwinkle = 0.78 + 0.22 * sin(twPhase);

  /* Size scaling — perspective + tier + intensity. */
  float baseSize = aSize * (220.0 / max(0.01, -mv.z)) * uPixelRatio;
  baseSize *= (0.6 + 0.6 * uIntensity);
  baseSize *= mix(1.0, 0.7, uCollapse);
  baseSize *= (1.0 + aTier * 0.6); /* tier 0 small, tier 2 large */
  gl_PointSize = clamp(baseSize, 1.0, 110.0);

  vRadial = aRadius / 30.0;
}
`;

export const GALAXY_FRAG = /* glsl */ `
uniform float uIntensity;
uniform vec3 uColorWarm;
uniform vec3 uColorCool;

varying float vSeed;
varying float vRadial;
varying float vColorMix;
varying float vTier;
varying float vTwinkle;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  if (d > 0.5) discard;

  /* Two-stage falloff — sharp core + long halo. The bright tier gets a 4-pointed
     anisotropic flare (subtle cross star) so a few points read as proper stars. */
  float core = pow(1.0 - smoothstep(0.0, 0.5, d), 3.0);
  float halo = pow(1.0 - d * 2.0, 2.4);

  /* 4-pointed flare (only for bright tier). */
  float angle = atan(uv.y, uv.x);
  float flare = pow(max(0.0, 1.0 - d * 2.0), 1.0);
  flare *= 0.5 + 0.5 * cos(angle * 4.0);
  flare = pow(flare, 4.0);

  /* Color: blend warm/cool by aColorMix; bright tier biases toward warm white. */
  vec3 base = mix(uColorWarm, uColorCool, vColorMix);
  vec3 hot = mix(base, vec3(1.0, 0.96, 0.86), 0.7);
  vec3 col = mix(base, hot, vTier * 0.5);

  /* Sub-pixel hot spike at the center for tier >= 1. */
  col += vec3(1.0, 0.95, 0.82) * pow(core, 6.0) * (0.4 + vTier * 0.4);

  /* Outer-radius particles cool slightly. */
  col = mix(col, mix(col, uColorCool, 0.35), smoothstep(0.6, 1.4, vRadial));

  float alpha = (core * 0.85 + halo * 0.18 + flare * 0.25 * vTier) * vTwinkle * (0.55 + 0.5 * uIntensity);
  gl_FragColor = vec4(col * (0.55 + 0.5 * uIntensity), alpha);
}
`;
