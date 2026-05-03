import { useEffect, useRef } from "react";
import { ScriptPlayer } from "./ScriptPlayer";
import { ACT2_SCRIPT } from "../content/script";
import { AudioEngine } from "../audio/AudioEngine";
import { heartbeat } from "../audio/HeartbeatScheduler";

interface Props {
  startBeat: number;
  onComplete: () => void;
  onProgress: (p: number) => void;
  onVoice: (clipId: string) => void;
}

/* Act 2 — memories. The pulse imperceptibly quickens, the song bleeds in from another room. */
export function MemoriesAct({ startBeat, onComplete, onProgress, onVoice }: Props) {
  const rampedRef = useRef(false);
  const songStartedRef = useRef(false);

  useEffect(() => {
    if (!rampedRef.current) {
      rampedRef.current = true;
      heartbeat.rampToBpm(60, ACT2_SCRIPT.reduce((s, e) => s + e.beats, 0));
    }
    if (!songStartedRef.current) {
      songStartedRef.current = true;
      AudioEngine.playSong();
      AudioEngine.setSongVolume(0);
      AudioEngine.setTargetSongVolume(0.04); /* "in another room" */
    }
  }, []);

  return (
    <ScriptPlayer
      script={ACT2_SCRIPT}
      startBeat={startBeat}
      onComplete={onComplete}
      onProgress={onProgress}
      onVoice={onVoice}
      scale={1}
    />
  );
}
