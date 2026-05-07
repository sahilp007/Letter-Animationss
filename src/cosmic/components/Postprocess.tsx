import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

interface Props {
  bloom: number;
  vignette: number;
  aberration?: number;
}

export function Postprocess({ bloom, vignette, aberration = 0.0008 }: Props) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloom}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.4}
        mipmapBlur
        kernelSize={3}
      />
      <ChromaticAberration
        offset={new Vector2(aberration, aberration)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.2} darkness={vignette} />
    </EffectComposer>
  );
}
