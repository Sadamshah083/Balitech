/**
 * Defers work until the browser has nothing better to do.
 *
 * Several decorative features — the scroll ribbon, the hero clip, GSAP itself —
 * used to run as soon as React mounted, which put them in direct competition
 * with hydration for the main thread. Returns a cancel function for effect
 * cleanup.
 */
export function onIdle(task: () => void, timeout = 2000): () => void {
  if (typeof window === "undefined") return () => {};

  const idle = window.requestIdleCallback as
    | typeof window.requestIdleCallback
    | undefined;

  if (!idle) {
    const timer = window.setTimeout(task, 400);
    return () => window.clearTimeout(timer);
  }

  const handle = idle(task, { timeout });
  return () => window.cancelIdleCallback?.(handle);
}
