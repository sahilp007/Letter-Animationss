import { useEffect, useState } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { ambientSrc, songSrc, voiceClips } from "../audio/tracks";

interface PreloadState {
  loading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Preloads audio assets after the AudioEngine has been unlocked.
 * Failures are non-fatal — missing assets are tolerated so the shell can run
 * with placeholder content during development.
 */
export function usePreload(enabled: boolean): PreloadState {
  const [state, setState] = useState<PreloadState>({ loading: enabled, progress: 0, error: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tasks: Promise<unknown>[] = [
      AudioEngine.loadSong(songSrc),
      AudioEngine.loadAmbient(ambientSrc),
      ...voiceClips.map((clip) => AudioEngine.loadVoiceClip(clip.id, clip.src)),
    ];
    let done = 0;
    tasks.forEach((task) => {
      task.finally(() => {
        if (cancelled) return;
        done += 1;
        setState((s) => ({ ...s, progress: done / tasks.length }));
      });
    });
    Promise.allSettled(tasks).then(() => {
      if (cancelled) return;
      setState({ loading: false, progress: 1, error: null });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
