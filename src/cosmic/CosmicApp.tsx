import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Nebula } from "./components/Nebula";
import { ParticleField } from "./components/ParticleField";
import { CameraRig } from "./components/CameraRig";
import { Postprocess } from "./components/Postprocess";
import { MemoryStarComp } from "./components/MemoryStar";
import { CosmicLoader } from "./components/CosmicLoader";
import { Opening } from "./scenes/Opening";
import { Lift } from "./scenes/Lift";
import { Galaxy } from "./scenes/Galaxy";
import { Conductor } from "./scenes/Conductor";
import { Crescendo } from "./scenes/Crescendo";
import { Coda } from "./scenes/Coda";
import { useTimeline } from "./hooks/useTimeline";
import { useGesture } from "./hooks/useGesture";
import { ScoreEngine } from "./audio/ScoreEngine";
import { NotesEngine } from "./audio/NotesEngine";
import { useTelemetry } from "../hooks/useTelemetry";
import { MEMORIES } from "./content/memories";
import type { Answer, MemoryStar, Movement } from "./types";
import "./cosmic.css";

const isDev = new URLSearchParams(window.location.search).has("dev");

interface SceneVisuals {
  particleForm: number;
  particleCollapse: number;
  particleIntensity: number;
  nebulaIntensity: number;
  bloom: number;
  vignette: number;
  warm: [number, number, number];
  cool: [number, number, number];
  deep: [number, number, number];
  showMemoryStars: boolean;
}

const VISUALS: Record<Movement, SceneVisuals> = {
  opening: {
    particleForm: 0,
    particleCollapse: 0,
    particleIntensity: 0.05,
    nebulaIntensity: 0.05,
    bloom: 0.5,
    vignette: 0.7,
    warm: [1.0, 0.85, 0.55],
    cool: [0.5, 0.55, 0.85],
    deep: [0.04, 0.03, 0.06],
    showMemoryStars: false,
  },
  lift: {
    particleForm: 0.25,
    particleCollapse: 0,
    particleIntensity: 0.4,
    nebulaIntensity: 0.4,
    bloom: 0.9,
    vignette: 0.55,
    warm: [1.0, 0.78, 0.5],
    cool: [0.55, 0.55, 0.95],
    deep: [0.05, 0.03, 0.09],
    showMemoryStars: false,
  },
  galaxy: {
    particleForm: 1,
    particleCollapse: 0,
    particleIntensity: 0.85,
    nebulaIntensity: 0.85,
    bloom: 1.4,
    vignette: 0.45,
    warm: [1.0, 0.78, 0.45],
    cool: [0.5, 0.6, 1.0],
    deep: [0.04, 0.02, 0.1],
    showMemoryStars: false,
  },
  conductor: {
    particleForm: 1,
    particleCollapse: 0,
    particleIntensity: 1.0,
    nebulaIntensity: 1.0,
    bloom: 1.7,
    vignette: 0.4,
    warm: [1.0, 0.82, 0.55],
    cool: [0.55, 0.7, 1.0],
    deep: [0.05, 0.03, 0.12],
    showMemoryStars: true,
  },
  crescendo: {
    particleForm: 1,
    particleCollapse: 1,
    particleIntensity: 1.4,
    nebulaIntensity: 1.4,
    bloom: 2.6,
    vignette: 0.3,
    warm: [1.0, 0.95, 0.78],
    cool: [1.0, 0.85, 0.6],
    deep: [0.1, 0.07, 0.05],
    showMemoryStars: false,
  },
  coda: {
    particleForm: 1,
    particleCollapse: 0.85,
    particleIntensity: 1.6,
    nebulaIntensity: 1.5,
    bloom: 2.4,
    vignette: 0.25,
    warm: [1.0, 0.95, 0.78],
    cool: [1.0, 0.88, 0.65],
    deep: [0.12, 0.08, 0.06],
    showMemoryStars: false,
  },
  moment: {
    particleForm: 1,
    particleCollapse: 0.5,
    particleIntensity: 0.65,
    nebulaIntensity: 0.7,
    bloom: 1.4,
    vignette: 0.5,
    warm: [0.9, 0.7, 0.55],
    cool: [0.45, 0.5, 0.85],
    deep: [0.05, 0.04, 0.08],
    showMemoryStars: false,
  },
};

export function CosmicApp() {
  const { state, enter } = useTimeline("opening");
  const [unlocked, setUnlocked] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [lastVisited, setLastVisited] = useState<MemoryStar | null>(null);
  const [lifting, setLifting] = useState(false);
  const cursorRef = useGesture();
  const telemetry = useTelemetry({ enabled: !isDev });
  const lastEnergyApply = useRef(0);

  /* Master target ramps with cursor energy in Movements II/III — her motion drives the swell. */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (state.movement !== "conductor" && state.movement !== "galaxy") return;
      const now = performance.now();
      if (now - lastEnergyApply.current < 800) return;
      lastEnergyApply.current = now;
      const target = 0.55 + cursorRef.current.energy * 0.55;
      ScoreEngine.setMasterTarget(target, 1500);
    }, 250);
    return () => window.clearInterval(id);
  }, [state.movement, cursorRef]);

  /* Auto-advance when each scene signals complete. */
  const onSceneComplete = useCallback(
    (next: Movement) => {
      telemetry.emit("movement_enter" as never, { movement: next });
      enter(next);
    },
    [enter, telemetry]
  );

  /* Trigger the lift transition out of Opening. */
  useEffect(() => {
    if (state.movement === "opening" && state.progress > 0.92 && !lifting) {
      setLifting(true);
      window.setTimeout(() => onSceneComplete("lift"), 1400);
    }
    if (state.movement !== "opening" && state.movement !== "lift") setLifting(false);
  }, [state.movement, state.progress, lifting, onSceneComplete]);

  const handleBegin = async () => {
    await NotesEngine.init();
    setUnlocked(true);
    telemetry.emit("session_start" as never, { ua: navigator.userAgent });
    /* Load the score in the background — small failures here are non-fatal. */
    void ScoreEngine.load(setLoadProgress).then(() => {
      ScoreEngine.startScore();
      ScoreEngine.setMasterTarget(0.85, 2000);
      setReady(true);
    });
  };

  const handleVisit = useCallback(
    (star: MemoryStar) => {
      if (visited.has(star.id)) return;
      ScoreEngine.playVoice(star.voiceId, star.position);
      setVisited((s) => new Set(s).add(star.id));
      setLastVisited(star);
      telemetry.emit("memory_visited" as never, { id: star.id });
    },
    [visited, telemetry]
  );

  const handleAnswer = (answer: Answer, timeToDecideMs: number) => {
    telemetry.emit("decision_made" as never, { answer, timeToDecideMs: Math.round(timeToDecideMs) });
    if (answer === "moment") enter("moment");
  };

  const handleReplay = () => {
    telemetry.emit("replay" as never);
    enter("coda");
  };

  const visuals = VISUALS[state.movement];

  /* Ensure the coda's Coda component knows whether we're in the holding subphase. */
  const inHolding = state.movement === "moment";
  const showCodaUI = state.movement === "coda" || state.movement === "moment";

  /* When entering coda from crescendo, fire question_shown once. */
  useEffect(() => {
    if (state.movement === "coda" && state.elapsed < 0.05) {
      telemetry.emit("question_shown" as never);
    }
  }, [state.movement, state.elapsed, telemetry]);

  const memoizedMemories = useMemo(() => MEMORIES, []);

  return (
    <div className="cosmic-app">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 35, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <color attach="background" args={["#04030a"]} />
        <Suspense fallback={null}>
          <Nebula intensity={visuals.nebulaIntensity} warm={visuals.warm} cool={visuals.cool} deep={visuals.deep} />
          <ParticleField
            form={visuals.particleForm}
            collapse={visuals.particleCollapse}
            intensity={visuals.particleIntensity}
            warm={visuals.warm}
            cool={visuals.cool}
          />
          {visuals.showMemoryStars &&
            memoizedMemories.map((m) => (
              <MemoryStarComp key={m.id} data={m} visited={visited.has(m.id)} onVisit={handleVisit} />
            ))}
          <CameraRig movement={state.movement} cursor={cursorRef} />
          <Postprocess bloom={visuals.bloom} vignette={visuals.vignette} />
        </Suspense>
      </Canvas>

      {/* HTML overlay scenes */}
      <div className="cosmic-overlay">
        {!unlocked && (
          <BeginGate onBegin={handleBegin} />
        )}

        {unlocked && !ready && (
          <CosmicLoader progress={loadProgress} headline="tuning the orchestra" />
        )}

        {ready && state.movement === "opening" && (
          <Opening
            progress={state.progress}
            onWordPlayed={(idx) => telemetry.emit("word_played" as never, { idx })}
            onComplete={() => {/* timeline auto-advances */}}
            lifting={lifting}
          />
        )}

        {ready && state.movement === "lift" && (
          <Lift progress={state.progress} onComplete={() => onSceneComplete("galaxy")} />
        )}

        {ready && state.movement === "galaxy" && (
          <Galaxy progress={state.progress} onComplete={() => onSceneComplete("conductor")} />
        )}

        {ready && state.movement === "conductor" && (
          <Conductor
            progress={state.progress}
            visited={visited}
            onVisit={(id) => {
              const m = memoizedMemories.find((mm) => mm.id === id);
              if (m) handleVisit(m);
            }}
            onComplete={() => onSceneComplete("crescendo")}
            lastVisited={lastVisited}
          />
        )}

        {ready && state.movement === "crescendo" && (
          <Crescendo progress={state.progress} onComplete={() => onSceneComplete("coda")} />
        )}

        <AnimatePresence>
          {ready && showCodaUI && (
            <Coda key="coda" onAnswer={handleAnswer} onReplay={handleReplay} inHolding={inHolding} />
          )}
        </AnimatePresence>
      </div>

      {isDev && (
        <CosmicDevPanel
          movement={state.movement}
          progress={state.progress}
          unlocked={unlocked}
          ready={ready}
          loadProgress={loadProgress}
          visited={visited.size}
          onJump={(m) => enter(m)}
        />
      )}
    </div>
  );
}

function BeginGate({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div
      className="cosmic-begin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6 }}
    >
      <div className="cosmic-begin__hint">headphones recommended</div>
      <button className="cosmic-begin__btn" onClick={onBegin}>begin</button>
      <div className="cosmic-begin__sub">a letter that plays itself</div>
    </motion.div>
  );
}

const MOVEMENTS: Movement[] = ["opening", "lift", "galaxy", "conductor", "crescendo", "coda", "moment"];
function CosmicDevPanel(props: {
  movement: Movement;
  progress: number;
  unlocked: boolean;
  ready: boolean;
  loadProgress: number;
  visited: number;
  onJump: (m: Movement) => void;
}) {
  return (
    <div className="cosmic-dev">
      <div className="cosmic-dev__row"><span>movement</span><span>{props.movement}</span></div>
      <div className="cosmic-dev__row"><span>progress</span><span>{(props.progress * 100).toFixed(0)}%</span></div>
      <div className="cosmic-dev__row"><span>audio</span><span>{props.unlocked ? (props.ready ? "ready" : `loading ${(props.loadProgress * 100) | 0}%`) : "locked"}</span></div>
      <div className="cosmic-dev__row"><span>visited</span><span>{props.visited}/6</span></div>
      <div className="cosmic-dev__jump">
        {MOVEMENTS.map((m) => (
          <button key={m} className={`cosmic-dev__btn${m === props.movement ? " is-active" : ""}`} onClick={() => props.onJump(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className="cosmic-dev__hint">?dev=1</div>
    </div>
  );
}
