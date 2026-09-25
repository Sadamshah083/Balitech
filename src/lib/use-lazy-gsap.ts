"use client";

import { useEffect, type RefObject } from "react";
import { loadGsap } from "@/lib/gsap-register";
import { onIdle } from "@/lib/on-idle";

type GsapBundle = Awaited<ReturnType<typeof loadGsap>>;
type GsapContext = ReturnType<GsapBundle["gsap"]["context"]>;

/**
 * How far ahead of the viewport an element counts as approaching, so the
 * library has arrived and the animation is set up before the section is close
 * enough for anyone to notice it happening.
 */
const LOOKAHEAD = "150% 0px 150% 0px";

/**
 * Runs a GSAP setup function scoped to `scope`, loading the library only once
 * `scope` is near the viewport.
 *
 * Every animation on the site is decorative and belongs to one section, and on
 * the home page those sections start as much as 13,000px down the page. Loading
 * on idle instead meant the whole of GSAP — 70 KB, and around a second of
 * evaluation on a mid-range phone — was fetched and run during load for
 * animations the visitor had not scrolled anywhere near.
 *
 * Selectors inside `setup` resolve against `scope`, and the context is reverted
 * on unmount, matching what `useGSAP` did before.
 */
export function useLazyGsap(
  setup: (bundle: GsapBundle) => void,
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const node = scope.current;
    if (!node) return;

    let cancelled = false;
    let cancelIdle = () => {};
    let context: GsapContext | undefined;

    const start = () => {
      // Still deferred to idle once in range, so arriving at a section never
      // costs a frame mid-scroll.
      cancelIdle = onIdle(() => {
        void loadGsap().then((bundle) => {
          if (cancelled || !scope.current) return;
          context = bundle.gsap.context(() => setup(bundle), scope);
        });
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      },
      { rootMargin: LOOKAHEAD }
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelIdle();
      context?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
