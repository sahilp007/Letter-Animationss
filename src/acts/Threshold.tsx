import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onBegin: () => void;
  loadingProgress: number;
  ready: boolean;
}

export function Threshold({ onBegin, loadingProgress, ready }: Props) {
  const [pressing, setPressing] = useState(false);

  return (
    <motion.div
      className="threshold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      <div className="threshold__hint">headphones recommended</div>
      <button
        className={`threshold__begin${pressing ? " is-pressing" : ""}`}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        onClick={onBegin}
        disabled={!ready}
        aria-label="Begin"
      >
        {ready ? "begin" : "·"}
      </button>
      {!ready && (
        <div className="threshold__loader" aria-hidden>
          <div className="threshold__loader-bar" style={{ transform: `scaleX(${loadingProgress})` }} />
        </div>
      )}
    </motion.div>
  );
}
