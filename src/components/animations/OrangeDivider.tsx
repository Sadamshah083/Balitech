"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function OrangeDivider() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative flex justify-center py-2">
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={isInView ? { width: "120px", opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-px bg-gradient-to-r from-transparent via-orange to-transparent"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute h-2 w-2 rounded-full bg-orange shadow-[0_0_12px_var(--orange-glow)] animate-orange-pulse"
      />
    </div>
  );
}
