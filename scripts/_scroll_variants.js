/**
 * The switches shared by _scroll_perf.js and _scroll_trace.js.
 *
 * Each one neutralises a single suspect without changing layout, so a run with
 * it on stays comparable to a run without. Kept in one file so the two scripts
 * cannot drift and start measuring subtly different things.
 */
const VARIANTS = [
  [
    "--noglass",
    `*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`,
  ],
  ["--noatmo", `.atmo { display: none !important; }`],
  ["--noribbon", `.light-path, [class*="light-path"] { display: none !important; }`],
  ["--nomotes", `.light-path__mote, .light-path__comet-rig { display: none !important; }`],
  [
    "--nostrandblur",
    `.light-path__strand, .light-path__strands--bloom, .light-path__strands--band,
     .light-path__strands--filament { filter: none !important; }`,
  ],
  ["--nocomet", `.light-path__comet-rig { display: none !important; }`],
  ["--nomotesonly", `.light-path__mote { display: none !important; }`],
  ["--nocurtain", `.light-path__curtain { display: none !important; }`],
  ["--noscreen", `.light-path { mix-blend-mode: normal !important; }`],
  ["--noblur", `*, *::before, *::after { filter: none !important; }`],
  ["--noshadow", `*, *::before, *::after { box-shadow: none !important; }`],
  ["--nogradient", `*, *::before, *::after { background-image: none !important; }`],
  /* Is it the radius that costs, or the number of blurred paths? Halving every
     radius tests the first; dropping the widest strand tests the second. */
  [
    "--halfblur",
    `.light-path__strands--bloom { filter: blur(21px) !important; }
     .light-path__strands--band { filter: blur(6.5px) !important; }
     .light-path__strands--filament { filter: blur(2px) !important; }`,
  ],
  /* Deliberately absent: a switch that shortens the ribbon by overriding
     `.light-path { height }`. It looks like a test of whether a blurred group's
     height is what costs, and it is not — a shorter ribbon also covers less of
     the page, so most of a scroll passes no ribbon at all. It read as a free
     win and sent me off building sliced geometry that measured identically to
     what it replaced. Blurred area is what costs, and scrolling past it pays
     for it wherever it is cut. */
  ["--nobloom", `.light-path__strands--bloom { display: none !important; }`],
  ["--noband", `.light-path__strands--band { display: none !important; }`],
  ["--nofilament", `.light-path__strands--filament { display: none !important; }`],
  /* Keeps every strand drawn and every radius intact, and only stops the widest
     one being blurred — separating "this layer costs because it is blurred"
     from "this layer costs because it is there". */
  ["--nobloomblur", `.light-path__strands--bloom { filter: none !important; }`],
  /* Can the browser be persuaded to keep the strands' rasterised tiles instead
     of redoing them, given nothing in that SVG ever changes? Purely a hint —
     it changes nothing about how the ribbon looks. */
  ["--strandlayer", `.light-path__svg { will-change: transform !important; }`],
  ["--pathlayer", `.light-path { will-change: transform !important; }`],
  ["--atmolayer", `.atmo { will-change: transform !important; }`],
  /* The inverse of what now ships, for checking the change still earns its
     place: run it against a build that has the hints and the difference is what
     they are worth, measured in the same session as the thing it is compared
     to. */
  [
    "--nohints",
    `.light-path__svg, .atmo { will-change: auto !important; }`,
  ],
  /* The curtain is as tall as the document and is moved on every scroll frame.
     It only has to cover what is on screen below the ribbon's tip, though, so
     most of that height is being composited for nothing. Same picture, a small
     fraction of the moving area. */
  ["--shortcurtain", `.light-path__curtain { height: 260vh !important; }`],
  /* Puts the background back the way it was — full-height curtain, blurred
     blooms — so what now ships can be compared against it in one session, and
     proved to look the same. */
  [
    "--oldbg",
    `.light-path__curtain { height: 100% !important; }
     .atmo__bloom { filter: blur(20px) !important; }`,
  ],
  /* Splits the atmosphere's cost: is it blending a viewport-sized layer against
     a backdrop that moves, or the four blurred shapes inside it? */
  ["--atmonoblend", `.atmo { mix-blend-mode: normal !important; }`],
  [
    "--atmonoblur",
    `.atmo__beam, .atmo__beam--trail, .atmo__bloom { filter: none !important; }`,
  ],
  /* Which of the two shapes is worth blurring. The blooms are radial gradients
     that fade to transparent well inside their own box, so a 20px blur over a
     62vw circle has very little left to soften; the beams are hard-edged pills
     where it is doing visible work. */
  ["--bloomnoblur", `.atmo__bloom { filter: none !important; }`],
  [
    "--beamnoblur",
    `.atmo__beam, .atmo__beam--trail { filter: none !important; }`,
  ],
  /* Freezes the scroll-linked drift without removing anything, to separate the
     cost of the movement from the cost of the layer being there at all.
     `!important` in a stylesheet outranks the inline value the script sets. */
  ["--atmofrozen", `.atmo { --atmo-progress: 0.5 !important; }`],
  /* The two hints together — neither changes a pixel, so if they add up this is
     the whole fix. */
  [
    "--combo",
    `.light-path__svg { will-change: transform !important; }
     .atmo { will-change: transform !important; }`,
  ],
  /* Not effects — the two page-level scrolling settings. `scroll-behavior` is
     set through the universal selector, and `overflow-x: hidden` on the root
     can take the document off the compositor's fast scrolling path. */
  ["--noSmooth", `*, html, body { scroll-behavior: auto !important; }`],
  ["--noClipX", `html, body { overflow-x: visible !important; }`],
  ["--noSticky", `* { position: static !important; }`],
];

function pick(args) {
  const css = VARIANTS.filter(([flag]) => args.includes(flag)).map(([, rule]) => rule);
  const label = args.filter((a) => a.startsWith("--no")).join(" ") || "baseline";
  return { css, label };
}

module.exports = { VARIANTS, pick };
