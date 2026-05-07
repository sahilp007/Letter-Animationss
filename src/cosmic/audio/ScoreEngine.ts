import { Howl } from "howler";
import { SCORE_STEMS, VOICE_CLIPS, LAYER_LEVELS } from "./stems";
import type { ScoreLayer } from "../types";

/**
 * The orchestral score is a set of synchronized stems. Each layer is a Howl that starts at the
 * same moment and runs for the same duration; we control its individual gain to "bring in" or
 * "pull out" instruments as the user interacts. This is more reliable than synchronized
 * AudioContext playback across many sources and lets us fade smoothly.
 *
 * Voice notes are spatially positioned via Howler's pannerAttr.
 */

class ScoreEngineImpl {
  private layers: Partial<Record<ScoreLayer, Howl>> = {};
  private voices = new Map<string, Howl>();
  private layerLevels: Record<ScoreLayer, number> = { ...LAYER_LEVELS };
  private targetLevels: Record<ScoreLayer, number> = {
    strings: 0,
    piano: 0,
    choir: 0,
    winds: 0,
    bass: 0,
    percussion: 0,
  };
  private started = false;
  private startedAt = 0;
  private masterTarget = 1;

  async load(onProgress?: (p: number) => void): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    let done = 0;
    const total = Object.keys(SCORE_STEMS).length + VOICE_CLIPS.length;
    const tick = () => {
      done += 1;
      onProgress?.(done / total);
    };

    for (const [layer, src] of Object.entries(SCORE_STEMS) as [ScoreLayer, string][]) {
      const howl = new Howl({ src: [src], html5: false, loop: false, volume: 0, preload: true });
      this.layers[layer] = howl;
      tasks.push(
        new Promise<void>((resolve) => {
          howl.once("load", () => {
            tick();
            resolve();
          });
          howl.once("loaderror", () => {
            tick();
            resolve();
          });
        })
      );
    }
    for (const v of VOICE_CLIPS) {
      const howl = new Howl({ src: [v.src], html5: false, volume: 0.95, preload: true });
      this.voices.set(v.id, howl);
      tasks.push(
        new Promise<void>((resolve) => {
          howl.once("load", () => {
            tick();
            resolve();
          });
          howl.once("loaderror", () => {
            tick();
            resolve();
          });
        })
      );
    }
    await Promise.allSettled(tasks);
  }

  /** Start every stem at gain 0; bring in via bringInLayer. Sync requires same-length files. */
  startScore(): void {
    if (this.started) return;
    this.started = true;
    this.startedAt = performance.now();
    for (const layer of Object.keys(this.layers) as ScoreLayer[]) {
      const howl = this.layers[layer];
      if (!howl) continue;
      howl.volume(0);
      howl.play();
    }
  }

  /** Bring a layer up smoothly. Idempotent — repeated calls just re-target the gain. */
  bringInLayer(layer: ScoreLayer, fadeMs = 1800): void {
    this.targetLevels[layer] = this.layerLevels[layer];
    const howl = this.layers[layer];
    if (!howl) return;
    howl.fade(howl.volume() as number, this.layerLevels[layer] * this.masterTarget, fadeMs);
  }

  /** Pull a layer back. */
  pullOutLayer(layer: ScoreLayer, fadeMs = 1500): void {
    this.targetLevels[layer] = 0;
    const howl = this.layers[layer];
    if (!howl) return;
    howl.fade(howl.volume() as number, 0, fadeMs);
  }

  /** Set the master target — multiplies all per-layer levels. Useful for the crescendo. */
  setMasterTarget(level: number, fadeMs = 1200): void {
    this.masterTarget = Math.max(0, Math.min(1.5, level));
    for (const layer of Object.keys(this.layers) as ScoreLayer[]) {
      const howl = this.layers[layer];
      if (!howl) continue;
      const target = this.targetLevels[layer] * this.masterTarget;
      howl.fade(howl.volume() as number, target, fadeMs);
    }
  }

  /** Bring everything in for the climax — full orchestra. */
  swellAll(fadeMs = 2400): void {
    for (const layer of Object.keys(this.layers) as ScoreLayer[]) {
      this.bringInLayer(layer, fadeMs);
    }
  }

  /** Drop everything — used for the held silence right before the question. */
  collapseAll(fadeMs = 800): void {
    for (const layer of Object.keys(this.layers) as ScoreLayer[]) {
      this.pullOutLayer(layer, fadeMs);
    }
  }

  /** Play a voice clip with optional spatial position. Returns ms duration. */
  playVoice(id: string, position?: [number, number, number]): number {
    const howl = this.voices.get(id);
    if (!howl) return 0;
    if (position) {
      howl.pos(position[0], position[1], position[2]);
      howl.pannerAttr({ panningModel: "HRTF", refDistance: 1, rolloffFactor: 0.6, distanceModel: "inverse" });
    }
    howl.play();
    return ((howl.duration() as number) || 0) * 1000;
  }

  /** Total elapsed ms since the score started — used for word-pacing in the climax. */
  scoreElapsedMs(): number {
    return this.started ? performance.now() - this.startedAt : 0;
  }
}

export const ScoreEngine = new ScoreEngineImpl();
