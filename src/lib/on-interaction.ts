/** Anything a person does that a page load does not. */
const INTERACTION_EVENTS = [
  "scroll",
  "wheel",
  "touchstart",
  "pointermove",
  "keydown",
] as const;

/**
 * Defers work until the visitor first does something.
 *
 * `onIdle` was not enough for the scroll ribbon. Idle time arrives while the
 * page is still painting, so a full-viewport SVG, the 44 KiB of GSAP it needs,
 * and a two-second reveal all landed inside the opening few seconds — competing
 * with the hero for the main thread and holding the page visually incomplete
 * the whole time. None of it is worth anything until the visitor scrolls.
 *
 * Pointer and key events are included alongside scroll so the ribbon is already
 * built by the time someone reaches for the wheel, rather than being assembled
 * under them on the first notch.
 *
 * Returns a cancel function for effect cleanup.
 */
export function onFirstInteraction(task: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let fired = false;

  const detach = () => {
    for (const type of INTERACTION_EVENTS) {
      window.removeEventListener(type, fire);
    }
  };

  function fire() {
    if (fired) return;
    fired = true;
    detach();
    task();
  }

  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, fire, { passive: true });
  }

  /* A reload restores the previous scroll position without firing an event, so
     someone returning to the middle of the page has effectively already
     interacted and should not have to nudge the wheel to get the ribbon. */
  if (window.scrollY > 0) fire();

  return detach;
}
