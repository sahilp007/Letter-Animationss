import { useEffect, useRef, useState } from "react";
import { heartbeat } from "../audio/HeartbeatScheduler";
import type { BeatEvent } from "../types";

/**
 * Subscribe a component to heartbeat events. Returns the latest beat event.
 * Use the optional `onBeat` callback for side effects (audio cues, voice clips).
 */
export function useBeat(onBeat?: (event: BeatEvent) => void): BeatEvent | null {
  const [latest, setLatest] = useState<BeatEvent | null>(null);
  const cbRef = useRef(onBeat);
  cbRef.current = onBeat;

  useEffect(() => {
    return heartbeat.on((event) => {
      setLatest(event);
      cbRef.current?.(event);
    });
  }, []);

  return latest;
}
