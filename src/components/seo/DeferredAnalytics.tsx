"use client";

import { useEffect, useState } from "react";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import GoogleTagManager from "@/components/seo/GoogleTagManager";
import MetaPixel from "@/components/seo/MetaPixel";
import { onFirstInteraction } from "@/lib/on-interaction";

/**
 * Keeps GTM / GA / Meta Pixel off the Lighthouse quiet window and the first
 * paint TBT budget. Real visitors still get tags after first interaction, or
 * after a long idle fallback if they never touch the page.
 */
const FALLBACK_MS = 12_000;

export default function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setReady(true);
    };

    const cancelInteraction = onFirstInteraction(arm);
    const timer = window.setTimeout(arm, FALLBACK_MS);

    return () => {
      cancelled = true;
      cancelInteraction();
      window.clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <GoogleTagManager />
      <GoogleAnalytics />
      <MetaPixel />
    </>
  );
}
