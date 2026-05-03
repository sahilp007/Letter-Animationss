import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Pulse } from "./visual/Pulse";
import { Threshold } from "./acts/Threshold";
import { PulseAct } from "./acts/Pulse";
import { MemoriesAct } from "./acts/Memories";
import { CrossfadeAct } from "./acts/Crossfade";
import { AnswerAct } from "./acts/Answer";
import { HoldingSpace } from "./acts/HoldingSpace";
import { AudioEngine } from "./audio/AudioEngine";
import { heartbeat } from "./audio/HeartbeatScheduler";
import { useBeat } from "./hooks/useBeat";
import { usePreload } from "./hooks/usePreload";
import { useTelemetry } from "./hooks/useTelemetry";
import { DevTools } from "./DevTools";
import type { ActId, Answer } from "./types";

const isDev = new URLSearchParams(window.location.search).has("dev");
const telemetryEnabled = !isDev;

export function App() {
  const [act, setAct] = useState<ActId>("threshold");
  const [unlocked, setUnlocked] = useState(false);
  const preload = usePreload(unlocked);
  const [actStartBeat, setActStartBeat] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [questionFrozen, setQuestionFrozen] = useState(false);
  const actEnteredAt = useRef(performance.now());
  const telemetry = useTelemetry({ enabled: telemetryEnabled });
  const latestBeatRef = useRef<number>(0);
  const beat = useBeat((event) => {
    latestBeatRef.current = event.index;
  });

  const transition = (next: ActId) => {
    if (next !== act) {
      telemetry.emit("act_complete", { from: act, durationMs: performance.now() - actEnteredAt.current });
    }
    actEnteredAt.current = performance.now();
    setAct(next);
    setActStartBeat(latestBeatRef.current);
    setProgress(0);
    telemetry.emit("act_enter", { act: next });
  };

  const handleBegin = async () => {
    await AudioEngine.unlock();
    heartbeat.setBpmSegments([{ startBeat: 0, endBeat: Infinity, startBpm: 50, endBpm: 50 }]);
    heartbeat.start();
    setUnlocked(true);
    telemetry.emit("session_start", { ua: navigator.userAgent });
    /* Hold a brief silence after Begin so the rhythm enters the room cleanly. */
    setTimeout(() => transition("pulse"), 1800);
  };

  /* Pause-on-blur: stop scheduling new beats, log it, resume on return. */
  useEffect(() => {
    if (!unlocked) return;
    const onVisibility = () => {
      if (document.hidden) {
        heartbeat.stop();
        telemetry.emit("pause_detected", { act, sinceStartMs: performance.now() - actEnteredAt.current });
      } else {
        heartbeat.start();
        telemetry.emit("resume", { act });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [unlocked, act, telemetry]);

  const handleAnswer = (answer: Answer, timeToDecideMs: number) => {
    telemetry.emit("decision_made", { answer, timeToDecideMs: Math.round(timeToDecideMs) });
    if (answer === "moment") {
      setQuestionFrozen(false);
      transition("holding");
    }
    /* On "yes" we stay in the answer act and let the bloom play out. */
  };

  const handleReplay = () => {
    telemetry.emit("replay");
    setQuestionFrozen(false);
    transition("answer");
  };

  return (
    <div className="app">
      <Pulse act={act} progress={progress} frozen={questionFrozen} />
      <AnimatePresence mode="wait">
        {act === "threshold" && (
          <Threshold
            key="threshold"
            onBegin={handleBegin}
            loadingProgress={preload.progress}
            ready={!unlocked || !preload.loading}
          />
        )}
        {act === "pulse" && (
          <PulseAct
            key="pulse"
            startBeat={actStartBeat}
            onComplete={() => transition("memories")}
            onProgress={setProgress}
          />
        )}
        {act === "memories" && (
          <MemoriesAct
            key="memories"
            startBeat={actStartBeat}
            onComplete={() => transition("crossfade")}
            onProgress={setProgress}
            onVoice={(clipId) => telemetry.emit("voice_played", { clipId })}
          />
        )}
        {act === "crossfade" && (
          <CrossfadeAct
            key="crossfade"
            startBeat={actStartBeat}
            onQuestionShown={() => telemetry.emit("question_shown")}
            onComplete={() => {
              setQuestionFrozen(true);
              transition("answer");
            }}
            onProgress={setProgress}
          />
        )}
        {act === "answer" && (
          <AnswerAct
            key="answer"
            onAnswer={handleAnswer}
            onHoverStart={(which) => telemetry.emit("decision_started", { which })}
          />
        )}
        {act === "holding" && <HoldingSpace key="holding" onReplay={handleReplay} />}
      </AnimatePresence>

      {isDev && (
        <DevTools
          act={act}
          beat={beat}
          progress={progress}
          unlocked={unlocked}
          onJump={(target) => {
            if (!unlocked) {
              void handleBegin().then(() => transition(target));
            } else {
              transition(target);
            }
          }}
        />
      )}
    </div>
  );
}
