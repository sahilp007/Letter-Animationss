import { useEffect, useState } from "react";
import { ScriptPlayer } from "./ScriptPlayer";
import { ACT1_SCRIPT, ACT1_WARMUP_BEATS } from "../content/script";

interface Props {
  startBeat: number;
  onComplete: () => void;
  onProgress: (p: number) => void;
}

/* Act 1 — establish the rhythm. Four warmup beats of pure pulse, then words begin. */
export function PulseAct({ startBeat, onComplete, onProgress }: Props) {
  const [scriptStartBeat, setScriptStartBeat] = useState<number | null>(null);

  useEffect(() => {
    setScriptStartBeat(startBeat + ACT1_WARMUP_BEATS);
  }, [startBeat]);

  if (scriptStartBeat === null) return null;
  return (
    <ScriptPlayer
      script={ACT1_SCRIPT}
      startBeat={scriptStartBeat}
      onComplete={onComplete}
      onProgress={onProgress}
      scale={0.9}
    />
  );
}
