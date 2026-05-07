import { QuietApp } from "./QuietApp";
import { CosmicApp } from "./cosmic/CosmicApp";

/**
 * Tiny route split — no router lib needed.
 *   /         → Cosmic Symphony (the main proposal)
 *   /quiet    → Heartbeat (a private alt)
 *   ?dev=1    → reveals dev tools in either path
 */
export function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path === "/quiet") return <QuietApp />;
  return <CosmicApp />;
}
