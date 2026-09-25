type Point = { x: number; y: number };

/** A point on the ribbon plus the heading of the curve there, in degrees. */
export type RibbonPoint = Point & { angle: number };

/** Which gradient a strand is stroked with. */
export type StrandTone = "blue" | "warm" | "white";

/** How thickly a strand is drawn, which also decides what it reads as. */
export type StrandWeight = "bloom" | "band" | "filament";

export type Strand = {
  d: string;
  tone: StrandTone;
  weight: StrandWeight;
  width: number;
  opacity: number;
};

/** A light mote floating alongside the ribbon. */
export type Mote = {
  x: number;
  y: number;
  r: number;
  tone: StrandTone;
  opacity: number;
};

export type Ribbon = {
  strands: Strand[];
  motes: Mote[];
  /** Where the ribbon's spine sits at a given document y. */
  pointAtY(y: number): RibbonPoint;
};

const LOBE_HEIGHT = 980;
const AMPLITUDE = 0.34;

/**
 * Pushes the top of the ribbon to the right, easing back to centre by the end
 * of `BIAS_SPAN`.
 *
 * The hero puts its copy in the left column and its media on the right, so an
 * unbiased ribbon enters the page straight through the headline. Offset, it
 * arrives behind the media instead — which is both the composition in the
 * reference and the only version where the headline is never crossed by a lit
 * strand.
 */
const HERO_BIAS = 0.14;
const BIAS_SPAN = 1500;

/**
 * The strands, back to front.
 *
 * `phase` shifts each one along the wave, which is what makes them cross
 * rather than run as one thick parallel bundle — the weave in the reference is
 * entirely down to these offsets disagreeing. `sweep` and `shift` then vary how
 * far each one throws and where it sits, so the bundle opens and closes as it
 * descends instead of holding a constant width.
 */
const STRANDS: {
  phase: number;
  sweep: number;
  shift: number;
  width: number;
  tone: StrandTone;
  weight: StrandWeight;
  opacity: number;
}[] = [
  /* Ambient haze. Wide and faint, so the bundle sits in its own glow rather
     than on flat black. */
  { phase: 0, sweep: 1, shift: 0, width: 190, tone: "blue", weight: "bloom", opacity: 0.2 },
  { phase: 0.17, sweep: 0.95, shift: 0.03, width: 150, tone: "warm", weight: "bloom", opacity: 0.16 },

  /* The body of the ribbon. Stacked widest to narrowest at slightly different
     offsets rather than drawn as one thick stroke: SVG cannot gradient across
     a stroke's width, so the sense of a ribbon having a lit face and a darker
     edge has to come from layering. */
  { phase: 0, sweep: 1, shift: 0, width: 58, tone: "blue", weight: "band", opacity: 0.72 },
  { phase: 0.21, sweep: 0.93, shift: 0.025, width: 42, tone: "warm", weight: "band", opacity: 0.62 },
  { phase: 0.08, sweep: 1.05, shift: -0.022, width: 26, tone: "blue", weight: "band", opacity: 0.6 },
  { phase: 0.3, sweep: 0.86, shift: 0.045, width: 16, tone: "warm", weight: "band", opacity: 0.62 },

  /* Bright edges. Thin enough to read as the highlight running along the
     bands rather than as bands of their own.

     These are the strands that decide whether the page is readable. Left crisp
     and white they cross 13px body copy at near-white luminance, which
     measures around 1.5:1 — so they are drawn a little wider and softer
     instead, spreading the same light over enough pixels that no single one
     gets close to the text. It also happens to match the reference more
     closely, where the highlights glow rather than cut. */
  { phase: 0.04, sweep: 1.02, shift: -0.008, width: 3.4, tone: "white", weight: "filament", opacity: 0.7 },
  { phase: 0.19, sweep: 0.96, shift: 0.02, width: 2.4, tone: "white", weight: "filament", opacity: 0.5 },
  { phase: 0.34, sweep: 0.88, shift: 0.04, width: 2, tone: "warm", weight: "filament", opacity: 0.55 },
  { phase: 0.12, sweep: 1.09, shift: -0.035, width: 1.8, tone: "blue", weight: "filament", opacity: 0.5 },
];

/**
 * Runs a Catmull-Rom spline through the sampled points and emits it as cubic
 * beziers. Sampling a sine and joining the samples with straight lines would
 * need hundreds of points before the corners stopped showing; interpolating
 * instead means ~16 points per lobe already reads as a clean curve.
 */
function toBezierPath(points: Point[]) {
  if (points.length < 2) return "";

  const round = (n: number) => n.toFixed(2);
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const previous = points[i - 1] ?? points[i];
    const start = points[i];
    const end = points[i + 1];
    const next = points[i + 2] ?? end;

    const c1x = start.x + (end.x - previous.x) / 6;
    const c1y = start.y + (end.y - previous.y) / 6;
    const c2x = end.x - (next.x - start.x) / 6;
    const c2y = end.y - (next.y - start.y) / 6;

    d +=
      ` C ${round(c1x)} ${round(c1y)},` +
      ` ${round(c2x)} ${round(c2y)},` +
      ` ${round(end.x)} ${round(end.y)}`;
  }

  return d;
}

/** Deterministic noise in [0, 1), so motes land in the same places on every
    rebuild instead of jumping when the page height changes. */
function jitter(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * A serpentine ribbon descending the page: x follows a sine, y advances
 * linearly.
 *
 * y stays monotonic on purpose. It is what lets the reveal be a plain
 * horizontal cut — the curve meets every scanline exactly once, so hiding
 * everything below a line hides exactly the undrawn tail — and it is why
 * `pointAtY` can exist at all.
 *
 * Coordinates come out in real pixels rather than a normalised viewBox, so the
 * strokes never have to be scaled and cannot end up thicker on one axis.
 */
export function buildRibbon(width: number, height: number): Ribbon {
  const lobes = Math.min(10, Math.max(3, Math.round(height / LOBE_HEIGHT)));
  const centre = width / 2;
  const samples = lobes * 16;

  /* Narrows the sweep at both ends so the ribbon eases into the page and out
     again, instead of hitting full width the instant it appears. */
  const taper = (t: number) => Math.sin(Math.PI * t) ** 0.55;

  const biasSpan = Math.min(height * 0.5, BIAS_SPAN);
  const bias = (t: number) =>
    width * HERO_BIAS * Math.max(0, 1 - (t * height) / biasSpan) ** 2;

  const xAt = (t: number, phase: number, sweep: number, shift: number) =>
    centre +
    width * shift +
    bias(t) +
    Math.sin((t * lobes + phase) * Math.PI * 2) *
      width *
      AMPLITUDE *
      sweep *
      (0.32 + 0.68 * taper(t));

  const strands: Strand[] = STRANDS.map((spec) => {
    const points: Point[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      points.push({ x: xAt(t, spec.phase, spec.sweep, spec.shift), y: t * height });
    }
    return {
      d: toBezierPath(points),
      tone: spec.tone,
      weight: spec.weight,
      width: spec.width,
      opacity: spec.opacity,
    };
  });

  /* Motes ride near the spine rather than anywhere on the page, so they read as
     sparks thrown off the ribbon instead of unrelated dust. */
  const motes: Mote[] = Array.from({ length: Math.max(8, lobes * 3) }, (_, i) => {
    const t = (i + 0.5) / Math.max(8, lobes * 3);
    const spread = width * (0.06 + jitter(i * 3.1) * 0.3);
    return {
      x: xAt(t, 0, 1, 0) + (jitter(i * 7.7) < 0.5 ? -spread : spread),
      y: t * height + (jitter(i * 5.3) - 0.5) * height * 0.04,
      r: 2 + jitter(i * 11.9) * 4,
      tone: jitter(i * 2.3) < 0.45 ? "warm" : "blue",
      opacity: 0.3 + jitter(i * 13.7) * 0.45,
    };
  });

  return {
    strands,
    motes,

    /* Evaluates the same sine the spine was sampled from, so the comet can be
       placed by document y without walking the rendered geometry. Exact in y:
       evenly spaced samples put the spline's y control points at the thirds,
       which makes y linear along every segment.

       The heading comes from a finite difference rather than the derivative —
       the taper's derivative blows up at both ends of the page. */
    pointAtY(y) {
      const t = Math.min(1, Math.max(0, y / height));
      const step = 1 / (samples * 8);
      const before = Math.max(0, t - step);
      const after = Math.min(1, t + step);

      return {
        x: xAt(t, 0, 1, 0),
        y: t * height,
        angle:
          (Math.atan2(
            (after - before) * height,
            xAt(after, 0, 1, 0) - xAt(before, 0, 1, 0)
          ) *
            180) /
          Math.PI,
      };
    },
  };
}
