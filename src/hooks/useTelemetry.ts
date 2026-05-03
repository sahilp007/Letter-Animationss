import { useCallback, useEffect, useRef } from "react";
import type { TelemetryEvent, TelemetryEventName } from "../types";

const ENDPOINT = "/api/track";

interface TelemetryConfig {
  enabled: boolean;
  /** Defaults to a per-tab UUID; you can override to align with your own logging. */
  sessionId?: string;
}

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Tiny telemetry emitter. sendBeacon-first so events survive tab close; fetch fallback otherwise.
 * Failures are silent — telemetry must never block or interrupt the experience.
 */
export function useTelemetry(config: TelemetryConfig) {
  const sessionRef = useRef<string>(config.sessionId ?? makeSessionId());
  const startedAt = useRef<number>(Date.now());

  const emit = useCallback(
    (name: TelemetryEventName, payload?: TelemetryEvent["payload"]) => {
      if (!config.enabled) return;
      const event: TelemetryEvent & { sessionId: string; sinceStartMs: number } = {
        name,
        at: Date.now(),
        payload,
        sessionId: sessionRef.current,
        sinceStartMs: Date.now() - startedAt.current,
      };
      const body = JSON.stringify(event);
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          const ok = navigator.sendBeacon(ENDPOINT, blob);
          if (ok) return;
        }
        void fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* swallow — telemetry never breaks the experience */
      }
    },
    [config.enabled]
  );

  useEffect(() => {
    const onUnload = () => emit("session_end", { duration: Date.now() - startedAt.current });
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, [emit]);

  return { emit, sessionId: sessionRef.current };
}
