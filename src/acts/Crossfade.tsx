import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScriptPlayer } from "./ScriptPlayer";
import { ACT3_BUILDUP_SCRIPT, ACT3_QUESTION } from "../content/script";
import { AudioEngine } from "../audio/AudioEngine";
import { heartbeat } from "../audio/HeartbeatScheduler";

interface Props {
  startBeat: number;
  onQuestionShown: () => void;
  onComplete: () => void;
  onProgress: (p: number) => void;
}

/* Act 3 — the question builds. Synthetic heartbeat fades down, song surges up, color blooms. */
export function CrossfadeAct({ startBeat, onQuestionShown, onComplete, onProgress }: Props) {
  const [stage, setStage] = useState<"buildup" | "question" | "settle">("buildup");
  const settledRef = useRef(false);
  const buildupBeats = ACT3_BUILDUP_SCRIPT.reduce((s, e) => s + e.beats, 0);
  const questionStartBeat = startBeat + buildupBeats;

  useEffect(() => {
    /* Quicken the rhythm and bring the song into the foreground. */
    heartbeat.rampToBpm(72, buildupBeats + ACT3_QUESTION.reduce((s, e) => s + e.beats, 0));
    AudioEngine.setTargetSongVolume(0.5);
    /* Fade synthetic heartbeat down to make room for the recorded one. */
    const t0 = performance.now();
    const total = (buildupBeats + ACT3_QUESTION.reduce((s, e) => s + e.beats, 0)) * (60_000 / 66);
    const fade = () => {
      const t = (performance.now() - t0) / total;
      const k = Math.max(0, Math.min(1, t));
      heartbeat.setSyntheticGain(1 - k * 0.6);
      if (k < 1 && !settledRef.current) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }, [buildupBeats]);

  return (
    <>
      {stage === "buildup" && (
        <ScriptPlayer
          script={ACT3_BUILDUP_SCRIPT}
          startBeat={startBeat}
          onComplete={() => {
            setStage("question");
            onQuestionShown();
          }}
          onProgress={(p) => onProgress(p * 0.5)}
          scale={1.05}
        />
      )}
      {stage === "question" && (
        <ScriptPlayer
          script={ACT3_QUESTION}
          startBeat={questionStartBeat}
          onComplete={() => {
            settledRef.current = true;
            setStage("settle");
            AudioEngine.setTargetSongVolume(0.7);
            heartbeat.setSyntheticGain(0.2);
            onComplete();
          }}
          onProgress={(p) => onProgress(0.5 + p * 0.5)}
          scale={1.6}
        />
      )}
      {stage === "settle" && (
        <motion.div
          className="script-stage script-stage--question"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <div className="script-line script-line--question" style={{ fontSize: "9vw" }}>
            will you marry me?
          </div>
        </motion.div>
      )}
    </>
  );
}
