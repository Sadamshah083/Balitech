import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type { gsap as GsapType } from "gsap";
import { onIdle } from "@/lib/on-idle";

type GsapBundle = {
  gsap: typeof GsapType;
  ScrollTrigger: typeof ScrollTriggerType;
};

let bundle: Promise<GsapBundle> | null = null;
let layoutWatched = false;

/**
 * Keeps trigger positions honest as the page settles.
 *
 * ScrollTrigger measures start/end offsets once and re-measures on `resize`
 * and `load`. Neither fires when a lazy image below the fold decodes, but the
 * page still gets taller — which leaves every trigger past that point measured
 * against a layout that no longer exists. A section can then sit stuck in the
 * hidden half of its `from()` tween because the scroll position it was waiting
 * for has moved. Watching the document height covers that case.
 */
function watchLayout(ScrollTrigger: typeof ScrollTriggerType) {
  if (layoutWatched || typeof ResizeObserver === "undefined") return;
  layoutWatched = true;

  let frame = 0;
  let lastHeight = document.documentElement.scrollHeight;

  const observer = new ResizeObserver(() => {
    const height = document.documentElement.scrollHeight;
    if (height === lastHeight) return;
    lastHeight = height;

    /* Coalesced to one refresh per frame: a grid of images finishing together
       would otherwise trigger a re-measure of the whole page for each one. */
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      ScrollTrigger.refresh();
    });
  });

  observer.observe(document.body);
}

/**
 * Loads GSAP on demand.
 *
 * GSAP plus ScrollTrigger is the single largest script this site ships, and
 * every animation it drives is decorative and below the fold. Importing it
 * statically put all of it on the critical path of every page, so it is now
 * fetched as its own chunk after hydration. Resolves to a shared instance, so
 * concurrent callers trigger exactly one download and one plugin registration.
 */
export function loadGsap(): Promise<GsapBundle> {
  if (!bundle) {
    bundle = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([core, plugin]) => {
        const gsap = core.gsap ?? core.default;
        const { ScrollTrigger } = plugin;
        gsap.registerPlugin(ScrollTrigger);
        watchLayout(ScrollTrigger);
        return { gsap, ScrollTrigger };
      }
    );
  }
  return bundle;
}

/**
 * Defers loading until the browser is idle, for animations that no one is
 * waiting on. Returns a cancel function for effect cleanup.
 */
export function loadGsapWhenIdle(
  onReady: (bundle: GsapBundle) => void
): () => void {
  let cancelled = false;

  const cancelIdle = onIdle(() => {
    void loadGsap().then((loaded) => {
      if (!cancelled) onReady(loaded);
    });
  });

  return () => {
    cancelled = true;
    cancelIdle();
  };
}
