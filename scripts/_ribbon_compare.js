/**
 * Proves the grouped strand blurs render the same picture as the per-path ones.
 *
 *   node scripts/_ribbon_compare.js [url] [--scroll=3200] [--mobile]
 *
 * Both shots come from one page load at one scroll position, so the reveal has
 * progressed to exactly the same place in each and the only difference left is
 * where the blur is applied. Comparing against the deployed site instead would
 * compare two different reveal states and two different document heights, which
 * is how a working change can look broken.
 */
const fs = require("fs");
const path = require("path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const MOBILE = args.includes("--mobile");
const hit = args.find((a) => a.startsWith("--scroll="));
const SCROLL = hit ? Number(hit.slice(9)) : 3200;

/* Puts the blurs back where they used to be: off the groups, onto each path. */
const PER_PATH = `
  .light-path__strands--bloom,
  .light-path__strands--band,
  .light-path__strands--filament { filter: none !important; }
  .light-path__strand--bloom { filter: blur(BLOOMpx) !important; }
  .light-path__strand--band { filter: blur(BANDpx) !important; }
  .light-path__strand--filament { filter: blur(FILAMENTpx) !important; }
`;

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
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      MOBILE
        ? { width: 412, height: 823, deviceScaleFactor: 2, mobile: true }
        : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(9000);

    /* A real gesture, so the reveal hands off from its intro exactly as it does
       for a visitor, then time to let the 0.8s scrub settle. */
    await cdp.send(
      "Input.synthesizeScrollGesture",
      { x: 700, y: 450, xDistance: 0, yDistance: -SCROLL, speed: 2500 },
      sessionId
    );
    await sleep(3000);

    const at = await evaluate(
      `JSON.stringify({
        y: window.scrollY,
        curtain: getComputedStyle(document.querySelector(".light-path__curtain")).transform,
        radii: ["bloom","band","filament"].map((w) =>
          getComputedStyle(document.querySelector(".light-path__strands--" + w)).filter),
      })`,
      sessionId
    );
    const state = JSON.parse(at);
    console.log(`\nscroll ${state.y}, curtain ${state.curtain}`);
    console.log(`group filters: ${state.radii.join("  ")}`);

    const shot = async (name) => {
      const out = path.join("tmp", name);
      const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      fs.mkdirSync("tmp", { recursive: true });
      fs.writeFileSync(out, Buffer.from(png.data, "base64"));
      return out;
    };

    const grouped = await shot(MOBILE ? "cmp_grouped_m.png" : "cmp_grouped.png");

    /* Reuse whatever radii the stylesheet resolved to, so this stays correct if
       they are ever retuned or the mobile overrides apply. */
    const radius = (v) => (v.match(/blur\(([\d.]+)px\)/) || [, "0"])[1];
    const css = PER_PATH.replace("BLOOM", radius(state.radii[0]))
      .replace("BAND", radius(state.radii[1]))
      .replace("FILAMENT", radius(state.radii[2]));

    await evaluate(
      `(() => {
        const s = document.createElement("style");
        s.id = "per-path-blur";
        s.textContent = ${JSON.stringify(css)};
        document.head.appendChild(s);
        return "ok";
      })()`,
      sessionId
    );
    await sleep(2000);

    const perPath = await shot(MOBILE ? "cmp_perpath_m.png" : "cmp_perpath.png");

    /* Difference measured in the page rather than by pulling both PNGs back
       out: the two frames are already on screen, so drawing them into a canvas
       and subtracting is both exact and quick. */
    const diff = await evaluate(
      `(async () => {
        const load = (src) => new Promise((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.src = src;
        });
        const [a, b] = await Promise.all([
          load("data:image/png;base64," + ${JSON.stringify(
            fs.readFileSync(grouped).toString("base64")
          )}),
          load("data:image/png;base64," + ${JSON.stringify(
            fs.readFileSync(perPath).toString("base64")
          )}),
        ]);
        const c = document.createElement("canvas");
        c.width = a.width; c.height = a.height;
        const g = c.getContext("2d");
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
        return JSON.stringify({
          total,
          changed,
          pct: (changed / total) * 100,
          meanDelta: sum / total,
          worstDelta: worst,
        });
      })()`,
      sessionId
    );

    const d = JSON.parse(diff);
    console.log(`\n   grouped vs per-path, same frame:`);
    console.log(`     pixels differing by >3/255 per channel   ${d.changed} of ${d.total} (${d.pct.toFixed(2)}%)`);
    console.log(`     mean difference across all channels      ${d.meanDelta.toFixed(2)} / 765`);
    console.log(`     worst single pixel                       ${d.worstDelta} / 765`);
    console.log(`\n   wrote ${grouped} and ${perPath}\n`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
