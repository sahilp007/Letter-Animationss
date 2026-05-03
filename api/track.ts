/**
 * Vercel Edge function — receives telemetry events from the proposal site and forwards
 * them to a Telegram bot (preferred) or a Discord webhook. Failures are logged but never
 * surfaced to the client. Optional Vercel KV write for an audit trail.
 *
 * Env vars (set in Vercel dashboard):
 *   TELEGRAM_BOT_TOKEN  + TELEGRAM_CHAT_ID  → push to your Telegram
 *   DISCORD_WEBHOOK_URL                       → push to a Discord channel
 *   ALLOWED_ORIGIN                             → CORS lock to your deployed domain
 *   KV_REST_API_URL    + KV_REST_API_TOKEN   → optional Upstash/Vercel KV for audit log
 */

export const config = { runtime: "edge" };

interface TelemetryRequest {
  name: string;
  at: number;
  payload?: Record<string, unknown>;
  sessionId?: string;
  sinceStartMs?: number;
}

const EVENT_GLYPHS: Record<string, string> = {
  session_start: "🌒  she opened the link",
  act_enter: "🌓  entered",
  act_complete: "🌔  finished",
  voice_played: "🎙   voice clip played",
  pause_detected: "⏸   tab lost focus",
  resume: "▶   tab returned",
  question_shown: "🌕  she saw the question",
  decision_started: "👁   hovering",
  decision_made: "💛  decision",
  replay: "↻   came back",
  session_end: "🌑  session ended",
};

function format(event: TelemetryRequest): string {
  const glyph = EVENT_GLYPHS[event.name] ?? `·  ${event.name}`;
  const time = new Date(event.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const elapsed = event.sinceStartMs !== undefined ? ` (+${(event.sinceStartMs / 1000).toFixed(1)}s)` : "";
  let detail = "";
  if (event.payload) {
    if (event.name === "decision_made") {
      const a = event.payload.answer === "yes" ? "yes" : "i need a moment";
      const dt = event.payload.timeToDecideMs ? ` · ${Math.round(Number(event.payload.timeToDecideMs) / 100) / 10}s to decide` : "";
      detail = `: ${a}${dt}`;
    } else {
      const compact = Object.entries(event.payload)
        .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" · ");
      if (compact) detail = ` — ${compact}`;
    }
  }
  return `${glyph}${detail}  ·  ${time}${elapsed}`;
}

async function pushTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, disable_notification: false }),
  }).catch(() => {});
}

async function pushDiscord(message: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  }).catch(() => {});
}

async function persistKV(event: TelemetryRequest): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  const key = `event:${event.at}:${event.sessionId ?? "anon"}`;
  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  }).catch(() => {});
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = process.env.ALLOWED_ORIGIN;
  const allow = allowed && origin && (allowed === "*" || origin === allowed) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false }), { status: 405, headers });

  let event: TelemetryRequest;
  try {
    event = (await req.json()) as TelemetryRequest;
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }
  if (!event?.name || typeof event.at !== "number") {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
  }

  const message = format(event);
  await Promise.allSettled([pushTelegram(message), pushDiscord(message), persistKV(event)]);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
