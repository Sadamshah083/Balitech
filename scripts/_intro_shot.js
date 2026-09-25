/**
 * Captures the home page intro wordmark at a chosen point in its wipe.
 *
 *   node scripts/_intro_shot.js [url] [--width=1024] [--progress=0.55] [--nomask]
 *
 * The wipe is a CSS animation driven by --intro-progress, so it is paused and
 * the property set by hand rather than trying to catch a frame. --nomask drops
 * the mask entirely, which is the reference for what the glyphs should look
 * like: a swash missing only in the masked shot is being clipped by the mask
 * box rather than by the layout.
 */
const fs = require("fs");
const path = require("path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org";
const WIDTH = Number((args.find((a) => a.startsWith("--width=")) || "--width=1024").slice(8));
const PROGRESS = (args.find((a) => a.startsWith("--progress=")) || "--progress=0.55").slice(11);
const NOMASK = args.includes("--nomask");
const OUT = (args.find((a) => a.startsWith("--out=")) || "--out=tmp/intro").slice(6);
/* Frame padding around the wordmark. Must exceed how far a swash can hang
   outside the box, or the capture clips it and looks like a rendering bug. */
const PAD = Number((args.find((a) => a.startsWith("--pad=")) || "--pad=60").slice(6));

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: 700, deviceScaleFactor: 2, mobile: false },
      sessionId
    );

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    /* Enough for the font to load; the animation is frozen straight after. */
    await sleep(3500);

    const setup = `(() => {
      const intro = document.querySelector(".hero-intro");
      const script = document.querySelector(".hero-intro__script");
      const ink = document.querySelector(".hero-intro__script-ink");
      if (!intro || !ink || !script) return "missing";

      /* Stop it leaving, and stop the property animating. */
      intro.classList.remove("is-leaving");
      intro.style.opacity = "1";
      intro.style.visibility = "visible";
      for (const el of [intro, document.querySelector(".hero-intro__percent")]) {
        if (el) el.style.animation = "none";
      }
      intro.style.setProperty("--intro-progress", ${JSON.stringify(PROGRESS)});
      ${NOMASK ? `ink.style.webkitMaskImage = "none"; ink.style.maskImage = "none";` : ""}

      const r = script.getBoundingClientRect();
      const ri = ink.getBoundingClientRect();
      return JSON.stringify({
        script: { x: r.x, y: r.y, w: r.width, h: r.height },
        ink: { x: ri.x, y: ri.y, w: ri.width, h: ri.height },
        font: getComputedStyle(ink).fontFamily,
        size: getComputedStyle(script).fontSize,
      });
    })()`;

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: setup, returnByValue: true },
      sessionId
    );
    if (result.value === "missing") throw new Error("intro elements not found");
    const box = JSON.parse(result.value);
    await sleep(400);

    /* Padded left so a swash hanging outside the box is still in frame. */
    const left = Math.max(0, box.ink.x - PAD);
    const clip = {
      x: left,
      y: Math.max(0, box.ink.y - 20),
      width: Math.min(WIDTH - left, box.ink.w + PAD * 2),
      height: box.ink.h + 40,
      scale: 2,
    };

    const shot = await cdp.send("Page.captureScreenshot", { format: "png", clip }, sessionId);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const file = `${OUT}${NOMASK ? "-nomask" : "-masked"}-p${PROGRESS}.png`;
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));

    console.log(`\nfont      ${box.font}`);
    console.log(`size      ${box.size}`);
    console.log(`script box x=${box.script.x.toFixed(1)} w=${box.script.w.toFixed(1)}`);
    console.log(`ink box    x=${box.ink.x.toFixed(1)} w=${box.ink.w.toFixed(1)}`);
    console.log(`   ink inset from script box: left ${(box.ink.x - box.script.x).toFixed(1)}px`);
    console.log(`\nwrote ${file}\n`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
