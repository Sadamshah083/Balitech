/**
 * Measures blocking time and frame churn on a load, with switches for each
 * thing on the page that never stops moving.
 *
 *   node scripts/_tbt_probe.js [url] [--cpu=4] [--seconds=10] [--only=a,b]
 *
 * Lighthouse's TBT is the single biggest slice of the performance score, and on
 * a slow machine this site was losing all 30 points of it. TBT is the sum of
 * everything a long task spends over 50ms, so a page that keeps animating pays
 * for every frame that runs long — forever, whether or not anyone is looking.
 * This reports that sum the way Lighthouse computes it, plus how many frames
 * were produced after the page should have gone quiet, and lets each suspect be
 * switched off in isolation.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const MOBILE = args.includes("--mobile");
const num = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const list = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3).split(",").filter(Boolean) : null;
};
const CPU = num("cpu", 4);
const SECONDS = num("seconds", 10);
const REPS = num("reps", 1);
const ONLY = list("only");

/**
 * Each variant turns off one source of perpetual motion. `css` is injected
 * before the document runs; `js` runs once the page has settled, for things a
 * stylesheet cannot stop — a playing video keeps decoding whether or not it is
 * displayed.
 */
const VARIANTS = [
  ["baseline", {}],
  [
    "novideo",
    {
      js: `document.querySelectorAll("video").forEach((v) => { try { v.pause(); v.removeAttribute("src"); v.load(); } catch {} });`,
    },
  ],
  [
    "nomotes",
    { css: `.light-path__mote, .light-path__comet-rig { display: none !important; }` },
  ],
  [
    "nofooterwave",
    {
      css: `.site-footer__wave, .site-footer__wave--back, [class*="footer-wave"],
            .site-footer canvas { animation: none !important; }`,
    },
  ],
  ["noframeworkdrift", { css: `.framework__drift, [class*="framework"] { animation: none !important; }` }],
  [
    "nointroanim",
    {
      css: `.hero-intro__halo, .hero-intro__spark, .hero-intro__percent,
            .hero-intro, .hero-intro * { animation: none !important; }`,
    },
  ],
  [
    "noanimation",
    {
      css: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
      js: `document.querySelectorAll("video").forEach((v) => { try { v.pause(); v.removeAttribute("src"); v.load(); } catch {} });`,
    },
  ],
  /* The audit machine has no GPU, so every blur, blend and promoted layer is
     rasterised on the CPU — which is why the effects are worth testing
     separately from the animations that move them. */
  ["noribbon", { css: `.light-path { display: none !important; }` }],
  ["noatmo", { css: `.atmo { display: none !important; }` }],
  [
    "noglass",
    { css: `*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }` },
  ],
  ["nohints", { css: `*, *::before, *::after { will-change: auto !important; }` }],
  ["noblur", { css: `*, *::before, *::after { filter: none !important; }` }],
  [
    "noeffects",
    {
      css: `.light-path, .atmo { display: none !important; }
            *, *::before, *::after {
              backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
              filter: none !important; will-change: auto !important;
              mix-blend-mode: normal !important;
            }`,
    },
  ],
];

/* Deliberately no requestAnimationFrame counter here. An earlier version had
   one, and it drove the compositor at 60fps by itself — so every variant
   produced the same number of frames and switching an animation off appeared
   to change nothing. Frame counts come from a passive trace instead
   (scripts/_boot_trace.js); this only listens. */
const MEASURE = `
  window.__lt = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); })
    .observe({ type: "longtask", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__fcp = e.startTime;
  }).observe({ type: "paint", buffered: true });
`;

async function measure(cdp, sessionId, variant, evaluate) {
  await cdp.send("Page.navigate", { url: "about:blank" }, sessionId);
  await sleep(300);

  /* These persist for the lifetime of the page target, so without removing them
     again each variant would run on top of every variant before it — and would
     start another frame-counting loop of its own. */
  const installed = [];
  const install = async (source) => {
    const { identifier } = await cdp.send(
      "Page.addScriptToEvaluateOnNewDocument",
      { source },
      sessionId
    );
    installed.push(identifier);
  };

  await install(MEASURE);
  if (variant.css) {
    await install(`document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = ${JSON.stringify(variant.css)};
      document.head.appendChild(s);
    });`);
  }

  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(4000);
  if (variant.js) await evaluate(variant.js, sessionId);

  await sleep(Math.max(1000, (SECONDS - 4) * 1000));

  const result = await evaluate(
    `(() => {
      const fcp = window.__fcp || 0;
      /* Lighthouse counts the part of each long task past 50ms, from FCP on. */
      let tbt = 0;
      for (const [start, dur] of window.__lt) {
        if (start + dur < fcp) continue;
        const clipped = start < fcp ? dur - (fcp - start) : dur;
        if (clipped > 50) tbt += clipped - 50;
      }
      /* Blocking time from the last two seconds only: start-up is over by then,
         so whatever is left is a page that will not sit still. */
      const tail = window.__lt.filter(([start]) => start > fcp + 6000);
      let tailBlocking = 0;
      for (const [, dur] of tail) if (dur > 50) tailBlocking += dur - 50;
      return {
        tbt: Math.round(tbt),
        tasks: window.__lt.filter(([, dur]) => dur > 50).length,
        longest: Math.round(Math.max(0, ...window.__lt.map((t) => t[1]))),
        tailBlocking: Math.round(tailBlocking),
        fcp: Math.round(fcp),
      };
    })()`,
    sessionId
  );

  for (const identifier of installed) {
    await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier }, sessionId);
  }
  return result;
}

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const evaluate = async (expression, sessionId) => {
    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    return result.value;
  };

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      MOBILE
        ? { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true }
        : { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);

    const chosen = VARIANTS.filter(([name]) => !ONLY || name === "baseline" || ONLY.includes(name));

    console.log(`\n${MOBILE ? "MOBILE" : "DESKTOP"}  ${URL_ARG}   cpu x${CPU}, ${SECONDS}s window\n`);
    const results = new Map();
    for (let rep = 0; rep < REPS; rep += 1) {
      for (const [name, variant] of chosen) {
        const r = await measure(cdp, sessionId, variant, evaluate);
        const prev = results.get(name) || [];
        prev.push(r);
        results.set(name, prev);
        process.stdout.write(".");
      }
    }
    console.log("\n");

    const med = (nums) => [...nums].sort((a, b) => a - b)[Math.floor(nums.length / 2)];
    const base = med(results.get("baseline").map((r) => r.tbt));

    console.log("   variant             TBT ms   vs base   long tasks   longest   blocking after 6s");
    console.log("   ────────────────────────────────────────────────────────────────────────────────");
    for (const [name] of chosen) {
      const rs = results.get(name);
      const tbt = med(rs.map((r) => r.tbt));
      const delta = name === "baseline" ? "" : `${tbt - base >= 0 ? "+" : ""}${tbt - base}`;
      console.log(
        `   ${name.padEnd(18)}  ${String(tbt).padStart(6)}   ${delta.padStart(7)}   ${String(
          med(rs.map((r) => r.tasks))
        ).padStart(10)}   ${String(med(rs.map((r) => r.longest))).padStart(7)}   ${String(
          med(rs.map((r) => r.tailBlocking))
        ).padStart(17)}`
      );
    }
    console.log(
      `\n   The last column is blocking time from long after start-up finished.\n` +
        `   A settled page should be zero there; anything else is work with no end.\n`
    );
  } finally {
    chrome.stop();
  }
})();
