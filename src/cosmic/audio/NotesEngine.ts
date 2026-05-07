import * as Tone from "tone";

/**
 * Cursor-as-instrument. When she touches a word, NotesEngine plays a single beautiful note in
 * the right register so the letter "plays itself" when she reads it. Uses Tone.js sampler-style
 * synthesis (FM + reverb tail) — pure synth, no samples, but tuned to feel orchestral.
 */

class NotesEngineImpl {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private vol: Tone.Volume | null = null;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    await Tone.start();
    this.vol = new Tone.Volume(-6).toDestination();
    this.reverb = new Tone.Reverb({ decay: 5.5, wet: 0.55 }).connect(this.vol);
    this.chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 6, depth: 0.5, wet: 0.25 }).connect(this.reverb);
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.4,
      modulationIndex: 6,
      envelope: { attack: 0.02, decay: 0.5, sustain: 0.0, release: 1.6 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.05, decay: 0.4, sustain: 0.0, release: 0.8 },
    }).connect(this.chorus);
    await this.reverb.generate();
    this.ready = true;
  }

  /** Play a note. semitone is relative to A3 (so 0 = A3, 12 = A4). velocity is 0..1. */
  play(semitone: number, velocity = 0.65): void {
    if (!this.ready || !this.synth) return;
    const freq = 220 * Math.pow(2, semitone / 12);
    this.synth.triggerAttackRelease(freq, "2n", undefined, velocity);
  }

  /** Play a soft chord — used for word transitions to layer harmony. */
  chord(rootSemitone: number, velocity = 0.45): void {
    if (!this.ready || !this.synth) return;
    const freqs = [0, 4, 7].map((n) => 220 * Math.pow(2, (rootSemitone + n) / 12));
    this.synth.triggerAttackRelease(freqs, "1n", undefined, velocity);
  }

  setMasterDb(db: number): void {
    if (this.vol) this.vol.volume.rampTo(db, 0.4);
  }
}

export const NotesEngine = new NotesEngineImpl();
