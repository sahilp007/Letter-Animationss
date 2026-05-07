import { AudioEngine } from "./audio/AudioEngine";
import { heartbeat } from "./audio/HeartbeatScheduler";
import type { ActId, BeatEvent } from "./types";

interface Props {
  act: ActId;
  beat: BeatEvent | null;
  progress: number;
  unlocked: boolean;
  onJump: (target: ActId) => void;
}

async function testThump(): Promise<void> {
  if (!AudioEngine.isUnlocked) await AudioEngine.unlock();
  heartbeat.testThump();
}

const ACTS: ActId[] = ["threshold", "pulse", "memories", "crossfade", "answer", "holding"];

/* Dev panel — toggled with `?dev=1`. Disabled in production builds and in the proposal URL. */
export function DevTools({ act, beat, progress, unlocked, onJump }: Props) {
  return (
    <div className="dev-tools" aria-hidden>
      <div className="dev-tools__row">
        <span className="dev-tools__label">act</span>
        <span className="dev-tools__value">{act}</span>
      </div>
      <div className="dev-tools__row">
        <span className="dev-tools__label">beat</span>
        <span className="dev-tools__value">{beat?.index ?? 0}</span>
      </div>
      <div className="dev-tools__row">
        <span className="dev-tools__label">bpm</span>
        <span className="dev-tools__value">{beat ? beat.bpm.toFixed(1) : "—"}</span>
      </div>
      <div className="dev-tools__row">
        <span className="dev-tools__label">progress</span>
        <span className="dev-tools__value">{(progress * 100).toFixed(0)}%</span>
      </div>
      <div className="dev-tools__row">
        <span className="dev-tools__label">audio</span>
        <span className="dev-tools__value">{unlocked ? "on" : "locked"}</span>
      </div>
      <div className="dev-tools__jump">
        {ACTS.map((a) => (
          <button key={a} className={`dev-tools__jump-btn${a === act ? " is-active" : ""}`} onClick={() => onJump(a)}>
            {a}
          </button>
        ))}
      </div>
      <div className="dev-tools__jump">
        <button className="dev-tools__jump-btn" onClick={() => void testThump()}>
          test thump
        </button>
      </div>
      <div className="dev-tools__hint">?dev=1 · proposal URL hides this panel</div>
    </div>
  );
}
