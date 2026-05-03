/**
 * Audio asset registry. Replace these placeholder paths with your real recordings before shipping.
 * The `optional: true` flag means the asset can be absent — voice clips and song are real, but the
 * shell still runs without them so you can build and test before content is finalized.
 */

export interface VoiceClip {
  id: string;
  src: string;
  /** Roughly when in beat-index this clip is meant to play (overridable from script.ts). */
  cueBeat?: number;
}

export const songSrc = "/audio/song.opus";
export const ambientSrc = "/audio/ambient-pad.opus";
export const heartbeatHerSrc = "/audio/heartbeat-her.opus";

export const voiceClips: VoiceClip[] = [
  { id: "v01", src: "/audio/voice-01.opus" },
  { id: "v02", src: "/audio/voice-02.opus" },
  { id: "v03", src: "/audio/voice-03.opus" },
  { id: "v04", src: "/audio/voice-04.opus" },
  { id: "v05", src: "/audio/voice-05.opus" },
  { id: "v06", src: "/audio/voice-06.opus" },
];
