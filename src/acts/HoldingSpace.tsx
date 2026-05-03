import { motion } from "framer-motion";
import { HOLDING_COPY } from "../content/script";

interface Props {
  onReplay: () => void;
}

/* Post-"i need a moment" landing. Warm, calm, no pressure, opt-in replay. */
export function HoldingSpace({ onReplay }: Props) {
  return (
    <motion.div
      className="holding-space"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6 }}
    >
      <motion.div
        className="holding-line"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      >
        {HOLDING_COPY.line1}
      </motion.div>
      <motion.div
        className="holding-line holding-line--soft"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.6 }}
      >
        {HOLDING_COPY.line2}
      </motion.div>
      <motion.button
        className="holding-replay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 4 }}
        onClick={onReplay}
      >
        {HOLDING_COPY.replay}
      </motion.button>
    </motion.div>
  );
}
