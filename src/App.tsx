import { Suspense, lazy } from "react";
import { QuietApp } from "./QuietApp";
import { CosmicLoader } from "./cosmic/components/CosmicLoader";

/* CosmicApp pulls three.js + drei + postprocessing + tone — code-split it so
   the initial paint can show the cinematic loader while the heavy chunks fly. */
const CosmicApp = lazy(() =>
  import("./cosmic/CosmicApp").then((m) => ({ default: m.CosmicApp }))
);

/**
 * Tiny route split — no router lib needed.
 *   /       → Cosmic Symphony (main proposal, lazy-loaded)
 *   /quiet  → Heartbeat (private alt, ships with entry)
 *   ?dev=1  → reveals dev tools
 */
export function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path === "/quiet") return <QuietApp />;
  return (
    <Suspense fallback={<CosmicLoader />}>
      <CosmicApp />
    </Suspense>
  );
}
