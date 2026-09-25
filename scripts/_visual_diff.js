/**
 * Proves a CSS override changes how fast the page draws without changing what
 * it draws.
 *
 *   node scripts/_visual_diff.js [url] --only=combo [--at=0,2400,5200] [--mobile]
 *
 * Both shots come from one page load at one scroll position, so the ribbon's
 * reveal has progressed to exactly the same place in each and the override is
 * the only difference left. Comparing against the deployed site instead would
 * compare two different reveal states and two different document heights, which
 * is how a working change can look broken.
 *
 * Anything animating is hidden in both shots. The motes drift continuously, so
 * left visible they differ between two screenshots taken seconds apart whatever
 * the override does, and a real regression would be lost in that noise.
 *
 * `will-change` is defined to be a hint that affects nothing visible, but it
 * does move an element onto the GPU, and text and edges can land a shade
 * differently once they are composited rather than painted. A mean difference
 * near zero with a handful of pixels differing along edges is that, and is
 * fine. Whole regions differing is not.
 */
const fs = require("fs");
const path = require("path");
const { launch, connect, sleep } = require("./_chrome");
const { VARIANTS } = require("./_scroll_variants");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const MOBILE = args.includes("--mobile");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").split("=")[1];
const AT = (args.find((a) => a.startsWith("--at=")) || "--at=0,2400,5200")
  .split("=")[1]
  .split(",")
  .map(Number);

const wanted = ONLY ? (ONLY.startsWith("--") ? ONLY : `--${ONLY}`) : null;
const found = VARIANTS.find(([flag]) => flag === wanted);
if (!found) {
  console.error(`unknown variant ${wanted}. known: ${VARIANTS.map(([f]) => f).join(" ")}`);
  process.exit(1);
}
const [FLAG, CSS] = found;

/* Held still in both shots so the comparison is of the page, not of where the
   drifting particles or the hero reel happened to be. The hero slider alone
   moved a third of the pixels at scroll 0 and reported a clean change as a
   regression. */
const FREEZE = `
  .light-path__mote,
  .light-path__comet-rig,
  .hero-bg-slider { visibility: hidden !important; }
`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      MOBILE
        ? { width: 412, height: 823, deviceScaleFactor: 2, mobile: true }
        : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const evaluate = async (expression) => {
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise: true },
        sessionId
      );
      return result.value;
    };

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(9000);

    /* A real gesture, so the reveal hands off from its intro exactly as it does
       for a visitor. */
    await cdp.send(
      "Input.synthesizeScrollGesture",
      { x: 700, y: 450, xDistance: 0, yDistance: -400, speed: 2500 },
      sessionId
    );
    await sleep(2000);

    await evaluate(`
      (() => {
        const s = document.createElement("style");
        s.id = "freeze";
        s.textContent = ${JSON.stringify(FREEZE)};
        document.head.appendChild(s);
        return "ok";
      })()
    `);

    const shot = async (name) => {
      const out = path.join("tmp", name);
      const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      fs.mkdirSync("tmp", { recursive: true });
      fs.writeFileSync(out, Buffer.from(png.data, "base64"));
      return out;
    };

    const setVariant = (on) =>
      evaluate(`
        (() => {
          const prev = document.getElementById("variant");
          if (prev) prev.remove();
          if (${on}) {
            const s = document.createElement("style");
            s.id = "variant";
            s.textContent = ${JSON.stringify(CSS)};
            document.head.appendChild(s);
          }
          return "ok";
        })()
      `);

    console.log(`\n${MOBILE ? "MOBILE" : "DESKTOP"}  ${URL_ARG}`);
    console.log(`variant ${FLAG}\n`);
    console.log(`   scroll      differing pixels        mean delta   worst pixel`);
    console.log(`   ──────────────────────────────────────────────────────────────`);

    let verdict = true;
    for (const y of AT) {
      await evaluate(`window.scrollTo(0, ${y}); "ok"`);
      /* The ribbon's reveal scrubs over 0.8s and the atmosphere follows the
         same scroll, so both need to come to rest before either shot. */
      await sleep(2600);

      await setVariant(false);
      await sleep(900);
      const before = await shot(`vd_${y}_off.png`);

      await setVariant(true);
      await sleep(1400);
      const after = await shot(`vd_${y}_on.png`);

      const diff = await evaluate(`
        (async () => {
          const load = (src) => new Promise((res) => {
            const i = new Image();
            i.onload = () => res(i);
            i.src = src;
          });
          const [a, b] = await Promise.all([
            load("data:image/png;base64," + ${JSON.stringify(
              fs.readFileSync(before).toString("base64")
            )}),
            load("data:image/png;base64," + ${JSON.stringify(
              fs.readFileSync(after).toString("base64")
            )}),
          ]);
          const c = document.createElement("canvas");
          c.width = a.width; c.height = a.height;
          const g = c.getContext("2d", { willReadFrequently: true });
          g.drawImage(a, 0, 0);
          const da = g.getImageData(0, 0, c.width, c.height).data;
          g.clearRect(0, 0, c.width, c.height);
          g.drawImage(b, 0, 0);
          const db = g.getImageData(0, 0, c.width, c.height).data;

          let changed = 0, sum = 0, worst = 0;
          const total = c.width * c.height;
          for (let i = 0; i < da.length; i += 4) {
            const d = Math.abs(da[i] - db[i]) + Math.abs(da[i+1] - db[i+1]) + Math.abs(da[i+2] - db[i+2]);
            if (d > 9) changed++;
            sum += d;
            if (d > worst) worst = d;
          }
          return JSON.stringify({ total, changed, pct: (changed / total) * 100, mean: sum / total, worst });
        })()
      `);

      const d = JSON.parse(diff);
      if (d.pct > 1) verdict = false;
      console.log(
        `   ${String(y).padEnd(8)}  ${String(d.changed).padStart(8)} of ${d.total} ` +
          `(${d.pct.toFixed(3)}%)   ${d.mean.toFixed(3)}/765   ${String(d.worst).padStart(4)}/765`
      );
      await setVariant(false);
    }

    console.log(
      `\n   ${
        verdict
          ? "identical to the eye — under 1% of pixels differ at every position"
          : "CHANGES THE PICTURE — investigate before shipping"
      }\n   shots in tmp/vd_*.png\n`
    );
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
