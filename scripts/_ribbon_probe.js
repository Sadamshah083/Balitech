/**
 * Counts how often the ribbon rebuilds its geometry while the page is scrolled.
 *
 *   node scripts/_ribbon_probe.js [url] [--mobile]
 *
 * The ribbon watches its own box with a ResizeObserver, and the sections below
 * the fold size themselves as they are scrolled into view — so the document
 * grows *during* the scroll. If that is crossing the rebuild threshold, a
 * 16,000px SVG is being regenerated mid-gesture, which is the kind of thing
 * that shows up as a 800ms frame.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org/";
const MOBILE = args.includes("--mobile");

const PROBE = `
  window.__rib = { svgSwaps: 0, heights: [], docHeights: [], attr: 0 };
  const root = document.querySelector(".light-path");
  if (root) {
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") {
          for (const n of r.addedNodes) {
            if (n.nodeName === "svg") {
              window.__rib.svgSwaps++;
              window.__rib.heights.push(Number(n.getAttribute("height")));
              window.__rib.docHeights.push(document.documentElement.scrollHeight);
            }
          }
        }
      }
    }).observe(root, { childList: true, subtree: true });
  }
  const svg = document.querySelector(".light-path__svg");
  if (svg) {
    window.__rib.startHeight = Number(svg.getAttribute("height"));
    window.__rib.startDoc = document.documentElement.scrollHeight;
  }
  "ok";
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
    if (MOBILE) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 }, sessionId);

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(MOBILE ? 9000 : 6000);

    /* Arms the ribbon, which only builds after a first interaction. */
    await cdp.send(
      "Input.synthesizeScrollGesture",
      { x: 200, y: 400, xDistance: 0, yDistance: -200, speed: 2000 },
      sessionId
    );
    await sleep(3000);
    await evaluate(`window.scrollTo(0, 0); "ok"`, sessionId);
    await sleep(800);

    await evaluate(PROBE, sessionId);

    for (let i = 0; i < 3; i++) {
      await cdp.send(
        "Input.synthesizeScrollGesture",
        { x: 200, y: 400, xDistance: 0, yDistance: -9000, speed: 3000 },
        sessionId
      );
      await sleep(600);
      await evaluate(`window.scrollTo(0, 0); "ok"`, sessionId);
      await sleep(500);
    }

    const out = JSON.parse(await evaluate(`JSON.stringify(window.__rib)`, sessionId));

    console.log(`\n${MOBILE ? "MOBILE" : "DESKTOP"}  ${URL_ARG}\n`);
    console.log(`   svg height at rest        ${out.startHeight}px`);
    console.log(`   document height at rest   ${out.startDoc}px`);
    console.log(`   geometry rebuilds mid-scroll  ${out.svgSwaps}`);
    if (out.heights.length) {
      console.log(`   rebuilt at svg heights    ${out.heights.join(", ")}`);
      console.log(`   document was              ${out.docHeights.join(", ")}`);
    }
    console.log("");
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
