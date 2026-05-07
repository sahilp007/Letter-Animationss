import type { ScoreLayer } from "../types";

/**
 * Pre-composed orchestral stems. All stems should be the SAME duration and tempo so they
 * mix transparently — typical workflow: compose a single ~6 minute orchestral piece, then
 * export each section (strings, piano, choir, winds, bass, percussion) as its own file.
 *
 * Where to get the music:
 *  - License a track + stems from Artlist / Musicbed
 *  - Commission a composer (~$300-1000)
 *  - Generate with AI (Suno/Udio) and stem-separate
 *  - Use a public-domain orchestral piece and stem-separate via Demucs
 *
 * Place files at /public/audio/score/<layer>.opus
 */

export const SCORE_STEMS: Record<ScoreLayer, string> = {
  strings: "/audio/score/strings.opus",
  piano: "/audio/score/piano.opus",
  choir: "/audio/score/choir.opus",
  winds: "/audio/score/winds.opus",
  bass: "/audio/score/bass.opus",
  percussion: "/audio/score/percussion.opus",
};

/** Voice notes — same registry as Heartbeat. */
export const VOICE_CLIPS: { id: string; src: string }[] = [
  { id: "v01", src: "/audio/voice-01.opus" },
  { id: "v02", src: "/audio/voice-02.opus" },
  { id: "v03", src: "/audio/voice-03.opus" },
  { id: "v04", src: "/audio/voice-04.opus" },
  { id: "v05", src: "/audio/voice-05.opus" },
  { id: "v06", src: "/audio/voice-06.opus" },
];

/** Default mix levels per layer at full bring-in. Tune to taste during polish. */
export const LAYER_LEVELS: Record<ScoreLayer, number> = {
  strings: 0.85,
  piano: 0.7,
  choir: 0.6,
  winds: 0.55,
  bass: 0.7,
  percussion: 0.55,
};
