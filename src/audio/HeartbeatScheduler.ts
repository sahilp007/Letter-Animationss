import { AudioEngine } from "./AudioEngine";
import type { BeatEvent } from "../types";

type BeatListener = (event: BeatEvent) => void;

interface BpmSegment {
  startBeat: number;
  endBeat: number;
  startBpm: number;
  endBpm: number;
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

export class HeartbeatScheduler {
  private listeners = new Set<BeatListener>();
  private timer: number | null = null;
  private nextBeatTime = 0;
  private nextBeatIndex = 0;
  private running = false;
  private segments: BpmSegment[] = [{ startBeat: 0, endBeat: Infinity, startBpm: 50, endBpm: 50 }];
  private synthHeartbeat = true;
  private syntheticGain = 1;

  setBpmSegments(segments: BpmSegment[]): void {
    this.segments = [...segments];
  }

  /** Push a tempo change as the song plays — used to ramp BPM smoothly across acts. */
  rampToBpm(targetBpm: number, overBeats: number): void {
    const lastBpm = this.bpmAtBeat(this.nextBeatIndex);
    this.segments.push({
      startBeat: this.nextBeatIndex,
      endBeat: this.nextBeatIndex + overBeats,
      startBpm: lastBpm,
      endBpm: targetBpm,
    });
    this.segments.push({
      startBeat: this.nextBeatIndex + overBeats,
      endBeat: Infinity,
      startBpm: targetBpm,
      endBpm: targetBpm,
    });
  }

  setSyntheticHeartbeat(on: boolean): void {
    this.synthHeartbeat = on;
  }

  setSyntheticGain(g: number): void {
    this.syntheticGain = Math.max(0, Math.min(1, g));
  }

  on(listener: BeatListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.running) return;
    const ctx = AudioEngine.audioContext;
    if (!ctx) throw new Error("HeartbeatScheduler: AudioEngine not unlocked");
    this.running = true;
    this.nextBeatTime = ctx.currentTime + 0.2;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private bpmAtBeat(beat: number): number {
    for (const seg of this.segments) {
      if (beat >= seg.startBeat && beat < seg.endBeat) {
        if (seg.endBeat === Infinity) return seg.endBpm;
        const t = (beat - seg.startBeat) / (seg.endBeat - seg.startBeat);
        return seg.startBpm + (seg.endBpm - seg.startBpm) * t;
      }
    }
    return this.segments[this.segments.length - 1]?.endBpm ?? 50;
  }

  private tick = (): void => {
    if (!this.running) return;
    const ctx = AudioEngine.audioContext!;
    while (this.nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const bpm = this.bpmAtBeat(this.nextBeatIndex);
      const beatDuration = 60 / bpm;
      const event: BeatEvent = {
        index: this.nextBeatIndex,
        audioTime: this.nextBeatTime,
        performanceTime: performance.now() + (this.nextBeatTime - ctx.currentTime) * 1000,
        bpm,
      };
      if (this.synthHeartbeat) this.scheduleHeartbeatThump(this.nextBeatTime);
      // Use AudioContext clock to dispatch listener events at the audible moment.
      const delayMs = Math.max(0, (this.nextBeatTime - ctx.currentTime) * 1000);
      window.setTimeout(() => this.dispatch(event), delayMs);
      this.nextBeatTime += beatDuration;
      this.nextBeatIndex += 1;
    }
    this.timer = window.setTimeout(this.tick, LOOKAHEAD_MS);
  };

  private dispatch(event: BeatEvent): void {
    for (const fn of this.listeners) fn(event);
  }

  /** A two-thump heartbeat: lub-dub, scheduled on the AudioContext clock. */
  private scheduleHeartbeatThump(when: number): void {
    const ctx = AudioEngine.audioContext!;
    const bus = AudioEngine.bus("heartbeat");
    /* S1 (lub) — louder, slightly higher fundamental so laptop speakers can reproduce it. */
    this.thump(ctx, bus, when, 95, 1.0 * this.syntheticGain);
    /* S2 (dub) — softer, comes ~180ms later. */
    this.thump(ctx, bus, when + 0.18, 80, 0.7 * this.syntheticGain);
  }

  /** Manually trigger one heartbeat right now. Useful from the dev panel for debugging. */
  testThump(): void {
    const ctx = AudioEngine.audioContext;
    if (!ctx) return;
    this.scheduleHeartbeatThump(ctx.currentTime + 0.05);
  }

  private thump(ctx: AudioContext, dest: AudioNode, at: number, freq: number, peak: number): void {
    /* Body — sine wave with a fast pitch sweep, mimicking chest cavity resonance. */
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 320;
    lpf.Q.value = 0.7;
    body.type = "sine";
    body.frequency.setValueAtTime(freq * 1.6, at);
    body.frequency.exponentialRampToValueAtTime(freq * 0.85, at + 0.06);
    body.frequency.exponentialRampToValueAtTime(freq * 0.55, at + 0.22);
    bodyGain.gain.setValueAtTime(0.0001, at);
    bodyGain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
    body.connect(bodyGain);
    bodyGain.connect(lpf);
    lpf.connect(dest);
    body.start(at);
    body.stop(at + 0.4);

    /* Transient — short filtered noise burst (the "thwack" of a valve closing).
       This is what makes the heartbeat audible on laptop speakers — pure low-end
       gets eaten by small drivers, but a mid-range click cuts through. */
    const noiseDur = 0.05;
    const sr = ctx.sampleRate;
    const noiseLen = Math.floor(sr * noiseDur);
    const buf = ctx.createBuffer(1, noiseLen, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-(i / noiseLen) * 5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 280;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = peak * 0.55;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(at);
  }
}

export const heartbeat = new HeartbeatScheduler();
