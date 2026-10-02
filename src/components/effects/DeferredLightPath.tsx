"use client";

import { useEffect, useState, type ComponentType } from "react";
import { onFirstInteraction } from "@/lib/on-interaction";

/**
 * Keeps LightPath (GSAP + full-page SVG) out of the initial home client graph.
 * The ribbon already waited for first interaction before building; this only
 * delays downloading/evaluating that module until then. Empty shell matches
 * the armed=false DOM so layout is unchanged.
 */
export default function DeferredLightPath() {
  const [Path, setPath] = useState<ComponentType | null>(null);

  useEffect(
    () =>
      onFirstInteraction(() => {
        void import("@/components/effects/LightPath").then((mod) => {
          setPath(() => mod.default);
        });
      }),
    []
  );

  if (!Path) {
    return <div className="light-path" aria-hidden />;
  }

  return <Path />;
}
