"use client";

import { useEffect, useState, type ComponentType } from "react";
import { onFirstInteraction } from "@/lib/on-interaction";

/**
 * Ambient scroll light — tiny, but still a client island on every page.
 * Wait for first interaction so it never competes with homepage hydration
 * or Lighthouse's quiet window after load.
 */
export default function DeferredScrollAtmosphere() {
  const [Atmosphere, setAtmosphere] = useState<ComponentType | null>(null);

  useEffect(
    () =>
      onFirstInteraction(() => {
        void import("@/components/effects/ScrollAtmosphere").then((mod) => {
          setAtmosphere(() => mod.default);
        });
      }),
    []
  );

  if (!Atmosphere) {
    return <div className="atmo" aria-hidden />;
  }

  return <Atmosphere />;
}
