/**
 * Home page intro timings. The header stays hidden until the loader fades, and
 * the ribbon behind the page waits for it to leave, so all three read from here
 * to avoid drifting apart.
 *
 * The write itself is a CSS animation (`hero-intro-write`), not a timer — it has
 * to start at first paint rather than at hydration — so WRITE_MS below is also
 * `--intro-write` in globals.css, and the two have to be changed together.
 *
 * It is tempting to assume these lengths cap the page's Lighthouse score, since
 * the overlay is opaque and the hero behind it cannot be the largest contentful
 * paint until it has gone. They do not, and it is worth knowing why before
 * trading the animation away for points.
 *
 * The wordmark below *is* the LCP element, and Lighthouse attributes almost all
 * of its LCP to "element render delay" — which reads exactly like this wipe
 * being the cause. It is not. That phase is simulated from the network and CPU
 * graph, not measured from the paint the animation produces.
 *
 * These were 1500/1600/2050 ms for a long time, on the strength of a
 * measurement that shortening them cost six points. That was true when it was
 * taken and is not true now, so it is worth knowing why rather than trusting
 * either number on its own. The overlay is opaque, and back then the hero
 * behind it was fetched lazily at low priority — so the length of the intro
 * was buying the hero its loading time, and revealing sooner only moved that
 * work inside the measured window. The hero poster now carries `priority` and
 * is fetched at the head of the document instead, which is a better way to buy
 * the same thing. With the fetch no longer depending on the overlay to hide
 * it, the same shortening that once cost six points is now worth five to
 * seven: desktop went 91 -> 96 and Speed Index 2.75s -> 1.90s, and on a CPU
 * throttled four times it went 70 -> 77.
 *
 * The lesson is about the pairing rather than the numbers. An opaque overlay
 * only pays for itself while something behind it needs the cover; once the
 * hero loads on its own the overlay is just time the page spends looking
 * unfinished, which is precisely what Speed Index measures. Before changing
 * these again, check how the hero is being fetched.
 */

/**
 * The words the intro writes out.
 *
 * Exported because `scripts/optimize-media.js` subsets Great Vibes down to
 * exactly the characters used here — 3.7 KB instead of 28.9 KB for the full
 * Latin range, on a High-priority request that the largest contentful paint
 * waits for. The face is used nowhere else on the site, so reading the string
 * from here is what keeps the font and the text it has to render in step: edit
 * this and re-run `npm run optimize:media`.
 */
export const HERO_INTRO_WORDMARK = "Welcome to Bali Tech";

/** Length of the ink wipe across the wordmark. */
export const HERO_LOADER_WRITE_MS = 900;

/** When the overlay starts fading out, revealing the hero. */
export const HERO_LOADER_FADE_MS = 1000;

/**
 * When the overlay has finished leaving and the hero is fully visible.
 *
 * It is hidden at this point rather than unmounted — see the note in Hero.tsx —
 * so this is what the ribbon waits for before building itself, there being
 * nothing to see behind an opaque panel.
 */
export const HERO_LOADER_REMOVE_MS = 1400;
