"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Fbq = (...args: unknown[]) => void;

/**
 * Fires Meta Pixel PageView on client navigations. Skips the first render
 * because the base snippet already tracks the initial load.
 */
export default function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const fbq = (window as Window & { fbq?: Fbq }).fbq;
    if (typeof fbq === "function") {
      fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
