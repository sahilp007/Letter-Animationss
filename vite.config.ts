import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    /* Manual vendor chunks so the heavy WebGL + audio libs load in parallel with the
       cosmic application code, and the initial paint chunk stays small. */
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("three") ||
            id.includes("@react-three") ||
            id.includes("postprocessing") ||
            id.includes("@monogrid") ||
            id.includes("@react-spring") ||
            id.includes("camera-controls") ||
            id.includes("zustand") ||
            id.includes("its-fine") ||
            id.includes("meshline") ||
            id.includes("troika")
          ) {
            return "three";
          }
          if (id.includes("/tone/") || id.includes("standardized-audio-context")) return "tone";
          if (id.includes("/howler/")) return "howler";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("gsap")) return "gsap";
          if (id.includes("react-dom") || id.includes("react/") || id.includes("scheduler")) return "react";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
