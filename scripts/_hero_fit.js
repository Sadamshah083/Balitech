/**
 * Measures how the hero fits a laptop screen.
 *
 *   node scripts/_hero_fit.js [url] [--shots=tmp/hero]
 *
 * Laptops are the awkward case: wide enough for the two-column layout but far
 * shorter than the phone-shaped viewports a `100svh` hero is usually checked
 * against. This reports, per size, whether the hero overflows the fold, how
 * much of the media column the footage actually occupies, and how far the stat
 * rail overlaps it.
 */
const fs = require("node:fs");
const path = require("node:path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith("--")) || "https://balitech.org";
const SHOTS = (args.find((a) => a.startsWith("--shots=")) || "--shots=").slice(8);
const CUSTOM = (args.find((a) => a.startsWith("--sizes=")) || "--sizes=").slice(8);

/* Real laptop panels, not the round numbers. 1366x768 is still the single most
   common; 1536x864 is a 1920 panel at 125% scaling, which Windows defaults to. */
/* The heights here are viewport heights, not screen heights. A 1366x768 laptop
   running Chrome maximised has roughly 620px of viewport once the OS taskbar,
   title bar, tab strip, and omnibox are taken out, and Windows' default 125%
   scaling shrinks it further in CSS pixels. Those short-and-wide viewports are
   the ones that actually break, and testing only 768/800/900 misses them. */
const DEFAULT_SIZES = [
  { label: "390x844   phone        ", w: 390, h: 844, mobile: true },
  { label: "820x1180  tablet       ", w: 820, h: 1180, mobile: true },
  { label: "1024x640  small laptop ", w: 1024, h: 640 },
  { label: "1093x614  1366 @125%   ", w: 1093, h: 614 },
  { label: "1280x579  1280 windowed", w: 1280, h: 579 },
  { label: "1366x618  1366 windowed", w: 1366, h: 618 },
  { label: "1536x695  1536 windowed", w: 1536, h: 695 },
  { label: "1280x800  MacBook 13   ", w: 1280, h: 800 },
  { label: "1366x768  common PC    ", w: 1366, h: 768 },
  { label: "1440x900  MacBook Air  ", w: 1440, h: 900 },
  { label: "1536x864  1920 @125%   ", w: 1536, h: 864 },
  { label: "1920x1080 desktop      ", w: 1920, h: 1080 },
];

const SIZES = CUSTOM
  ? CUSTOM.split(",").map((s) => {
      const [w, h] = s.split("x").map(Number);
      return { label: `${w}x${h}`.padEnd(22), w, h };
    })
  : DEFAULT_SIZES;

const PROBE = `JSON.stringify((() => {
  const pick = (s) => document.querySelector(s);
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) };
  };

  const section = pick(".hero-section");
  const shell = pick(".hero-shell");
  const copy = pick(".hero-copy");
  const media = pick(".hero-media");
  const frame = pick(".hero-media__frame");
  const stats = pick(".hero-media__stats");
  const career = pick(".hero-copy__career");
  const actions = pick(".hero-copy__actions");

  const f = box(frame);
  const s = box(stats);
  const m = box(media);

  return {
    viewport: { w: innerWidth, h: innerHeight },
    section: box(section),
    shell: box(shell),
    copy: box(copy),
    media: m,
    frame: f,
    stats: s,
    actions: box(actions),
    career: box(career),
    /* Positive means the stat rail sits on top of the footage. */
    overlap: f && s ? Math.round(f.right - s.x) : null,
    /* Slack between the rail and the viewport edge. */
    railToEdge: s ? Math.round(innerWidth - s.right) : null,
    /* Positive means the card stack is taller than the footage it sits over. */
    railOverhang: f && s ? Math.round(s.h - f.h) : null,
    /* How much of the media column the footage itself uses. */
    frameShareOfMedia: f && m ? Math.round((f.w / m.w) * 100) : null,
    /* Measured against the section's bottom edge, not its height: the navbar
       sits above it, so a hero exactly one viewport tall still spills. */
    sectionBottom: section ? Math.round(section.getBoundingClientRect().bottom) : null,
    heroTallerThanFold: section
      ? Math.round(section.getBoundingClientRect().bottom) > innerHeight + 1
      : null,
    careerBelowFold: career ? box(career).bottom > innerHeight : null,
    cardHeights: [...document.querySelectorAll(".hero-stat")].map((el) =>
      Math.round(el.getBoundingClientRect().height)
    ),
    docScrollW: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  };
})())`;

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    for (const size of SIZES) {
      await cdp.send(
        "Emulation.setDeviceMetricsOverride",
        {
          width: size.w,
          height: size.h,
          deviceScaleFactor: 1,
          mobile: Boolean(size.mobile),
        },
        sessionId
      );
      await cdp.send("Page.navigate", { url: BASE }, sessionId);
      /* Past the intro overlay so the hero is in its settled state. */
      await sleep(4200);

      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression: PROBE, returnByValue: true },
        sessionId
      );
      const d = JSON.parse(result.value);

      console.log(`\n${size.label}`);
      console.log(`   hero bottom edge   ${d.sectionBottom}px  vs fold ${d.viewport.h}px   ${d.heroTallerThanFold ? "OVERFLOWS by " + (d.sectionBottom - d.viewport.h) + "px" : "fits"}`);
      console.log(`   career link        ${d.careerBelowFold ? "BELOW FOLD (bottom " + d.career.bottom + "px)" : "visible"}`);
      console.log(`   copy column        ${d.copy.w}px`);
      console.log(`   media column       ${d.media.w}px`);
      console.log(`   footage frame      ${d.frame.w} x ${d.frame.h}px   (${d.frameShareOfMedia}% of its column)`);
      console.log(`   stat rail          ${d.stats.w}px wide, overlaps footage by ${d.overlap}px`);
      console.log(`   rail -> viewport   ${d.railToEdge}px of empty space`);
      console.log(`   card heights       ${d.cardHeights.join(", ")}px${new Set(d.cardHeights).size === 1 ? "  (even)" : "  (uneven)"}`);
      if (d.railOverhang !== null && d.railOverhang > 0 && d.viewport.w >= 1024) {
        console.log(`   RAIL OVERHANGS the footage by ${d.railOverhang}px`);
      }
      if (d.horizontalOverflow) console.log(`   HORIZONTAL OVERFLOW  scrollWidth ${d.docScrollW} > ${d.viewport.w}`);

      if (SHOTS) {
        const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
        const file = path.join(SHOTS, `${size.w}x${size.h}.png`);
        fs.writeFileSync(file, Buffer.from(data, "base64"));
      }
    }

    if (SHOTS) console.log(`\nshots in ${SHOTS}/`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
