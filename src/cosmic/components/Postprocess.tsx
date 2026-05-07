import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { Vector2 } from "three";

interface Props {
  bloom: number;
  vignette: number;
  aberration?: number;
}

/**
 * Post-processing chain — Bloom for the glowing core feel, ChromaticAberration for the lens
 * artifact that grounds it as "captured" rather than "rendered", Vignette for focus, and a
 * tiny Noise for filmic texture. Tuned to be cinematic but not noisy.
 */
export function Postprocess({ bloom, vignette, aberration = 0.0006 }: Props) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloom}
        luminanceThreshold={0.16}
        luminanceSmoothing={0.5}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      <ChromaticAberration
        offset={new Vector2(aberration, aberration)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation
        modulationOffset={0.6}
      />
      <Vignette eskil={false} offset={0.18} darkness={vignette} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.06} />
    </EffectComposer>
  );
}
