import { Howl } from "howler";

type BusName = "heartbeat" | "voice" | "song" | "ambient";

interface BusGains {
  heartbeat: number;
  voice: number;
  song: number;
  ambient: number;
}

const DEFAULT_GAINS: BusGains = {
  heartbeat: 1.6,
  voice: 0.95,
  song: 0.0,
  ambient: 0.15,
};

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses: Partial<Record<BusName, GainNode>> = {};
  private songHowl: Howl | null = null;
  private ambientHowl: Howl | null = null;
  private voiceHowls = new Map<string, Howl>();
  private unlocked = false;
  private startedAt = 0;

  get audioContext(): AudioContext | null {
    return this.ctx;
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  get sessionElapsedSeconds(): number {
    if (!this.ctx) return 0;
    return this.ctx.currentTime - this.startedAt;
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor({ latencyHint: "interactive" });
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    (Object.keys(DEFAULT_GAINS) as BusName[]).forEach((name) => {
      const g = this.ctx!.createGain();
      g.gain.value = DEFAULT_GAINS[name];
      g.connect(this.master!);
      this.buses[name] = g;
    });
    this.startedAt = this.ctx.currentTime;
    this.unlocked = true;
  }

  bus(name: BusName): GainNode {
    if (!this.buses[name]) throw new Error(`AudioEngine: bus ${name} not initialized`);
    return this.buses[name]!;
  }

  rampBus(name: BusName, target: number, seconds: number): void {
    if (!this.ctx || !this.buses[name]) return;
    const g = this.buses[name]!.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(target, now + seconds);
  }

  async loadSong(src: string): Promise<void> {
    this.songHowl = new Howl({ src: [src], html5: false, volume: 1, loop: false, preload: true });
    await new Promise<void>((resolve, reject) => {
      this.songHowl!.once("load", () => resolve());
      this.songHowl!.once("loaderror", (_id, err) => reject(err));
    }).catch(() => {});
  }

  playSong(): void {
    if (this.songHowl) this.songHowl.play();
  }

  setSongVolume(v: number): void {
    if (this.songHowl) this.songHowl.volume(Math.max(0, Math.min(1, v)));
  }

  fadeSongTo(target: number, ms: number): void {
    if (!this.songHowl) return;
    const cur = this.songHowl.volume() as number;
    this.songHowl.fade(cur, target, ms);
  }

  async loadAmbient(src: string): Promise<void> {
    this.ambientHowl = new Howl({ src: [src], html5: false, loop: true, volume: 0.4, preload: true });
    await new Promise<void>((resolve) => {
      this.ambientHowl!.once("load", () => resolve());
      this.ambientHowl!.once("loaderror", () => resolve());
    });
  }

  playAmbient(): void {
    if (this.ambientHowl) this.ambientHowl.play();
  }

  async loadVoiceClip(id: string, src: string): Promise<void> {
    const howl = new Howl({ src: [src], html5: false, volume: 1, preload: true });
    this.voiceHowls.set(id, howl);
    await new Promise<void>((resolve) => {
      howl.once("load", () => resolve());
      howl.once("loaderror", () => resolve());
    });
  }

  playVoice(id: string): number {
    const howl = this.voiceHowls.get(id);
    if (!howl) return 0;
    this.fadeSongTo(this.targetSongVolume * 0.6, 250);
    const playId = howl.play();
    howl.once("end", () => this.fadeSongTo(this.targetSongVolume, 600), playId);
    return (howl.duration(playId) as number) * 1000;
  }

  private targetSongVolume = 0;

  setTargetSongVolume(v: number): void {
    this.targetSongVolume = v;
    this.fadeSongTo(v, 1500);
  }
}

export const AudioEngine = new AudioEngineImpl();
