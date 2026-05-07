import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Nebula } from "./components/Nebula";
import { ParticleField } from "./components/ParticleField";
import { Starfield } from "./components/Starfield";
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
    particleIntensity: 0.04,
    nebulaIntensity: 0.06,
    bloom: 0.45,
    vignette: 0.78,
    /* warm = amber starlight, cool = deep cosmic teal — no purple. */
    warm: [1.0, 0.68, 0.28],
    cool: [0.18, 0.42, 0.62],
    deep: [0.005, 0.012, 0.022],
    showMemoryStars: false,
  },
  lift: {
    particleForm: 0.3,
    particleCollapse: 0,
    particleIntensity: 0.55,
    nebulaIntensity: 0.5,
    bloom: 1.0,
    vignette: 0.6,
    warm: [1.0, 0.66, 0.28],
    cool: [0.22, 0.5, 0.78],
    deep: [0.008, 0.018, 0.034],
    showMemoryStars: false,
  },
  galaxy: {
    particleForm: 1,
    particleCollapse: 0,
    particleIntensity: 0.95,
    nebulaIntensity: 0.95,
    bloom: 1.6,
    vignette: 0.48,
    warm: [1.0, 0.65, 0.26],
    cool: [0.16, 0.55, 0.92],
    deep: [0.006, 0.02, 0.045],
    showMemoryStars: false,
  },
  conductor: {
    particleForm: 1,
    particleCollapse: 0,
    particleIntensity: 1.1,
    nebulaIntensity: 1.05,
    bloom: 1.9,
    vignette: 0.42,
    warm: [1.0, 0.7, 0.32],
    cool: [0.2, 0.62, 1.0],
    deep: [0.008, 0.024, 0.055],
    showMemoryStars: true,
  },
  crescendo: {
    particleForm: 1,
    particleCollapse: 1,
    particleIntensity: 1.7,
    nebulaIntensity: 1.5,
    bloom: 3.0,
    vignette: 0.32,
    /* the explosion — gold/white dominant, cool side warms toward cream. */
    warm: [1.0, 0.88, 0.62],
    cool: [1.0, 0.78, 0.42],
    deep: [0.06, 0.04, 0.02],
    showMemoryStars: false,
  },
  coda: {
    particleForm: 1,
    particleCollapse: 0.78,
    particleIntensity: 1.7,
    nebulaIntensity: 1.55,
    bloom: 2.6,
    vignette: 0.28,
    warm: [1.0, 0.88, 0.62],
    cool: [1.0, 0.82, 0.5],
    deep: [0.09, 0.06, 0.03],
    showMemoryStars: false,
  },
  moment: {
    particleForm: 1,
    particleCollapse: 0.45,
    particleIntensity: 0.7,
    nebulaIntensity: 0.78,
    bloom: 1.5,
    vignette: 0.55,
    warm: [0.95, 0.62, 0.3],
    cool: [0.18, 0.4, 0.6],
    deep: [0.01, 0.02, 0.038],
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

  /* Fast-forward / rewind through movements with keyboard.
     P or ArrowRight  → next movement
     Shift+P or ArrowLeft → previous movement
     Skips the "moment" (holding) branch in normal advance. */
  useEffect(() => {
    if (!unlocked) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const order: Movement[] = ["opening", "lift", "galaxy", "conductor", "crescendo", "coda"];
      const cur = order.indexOf(state.movement);
      const isForward = e.key === "p" && !e.shiftKey;
      const isBack = (e.key === "P" && e.shiftKey) || (e.key === "p" && e.shiftKey);
      const isFwdArrow = e.key === "ArrowRight";
      const isBackArrow = e.key === "ArrowLeft";
      if (isForward || isFwdArrow) {
        e.preventDefault();
        if (cur >= 0 && cur < order.length - 1) enter(order[cur + 1]);
      } else if (isBack || isBackArrow) {
        e.preventDefault();
        if (cur > 0) enter(order[cur - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.movement, unlocked, enter]);

  return (
    <div className="cosmic-app">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 35, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <color attach="background" args={["#02040a"]} />
        <Suspense fallback={null}>
          <Nebula intensity={visuals.nebulaIntensity} warm={visuals.warm} cool={visuals.cool} deep={visuals.deep} />
          <Starfield intensity={Math.max(0.3, visuals.particleIntensity * 0.85)} />
          <ParticleField
            count={11000}
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
          <BeginGate onBegin={handleBegin} dev={isDev} />
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

function BeginGate({ onBegin, dev }: { onBegin: () => void; dev: boolean }) {
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
      {dev && <div className="cosmic-begin__shortcut">press P to skip ahead · Shift+P to step back</div>}
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
