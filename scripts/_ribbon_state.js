/**
 * Reports what the ribbon actually rendered: how many strands, what filter each
 * group resolved to, and where the curtain and comet ended up.
 *
 *   node scripts/_ribbon_state.js [url] [--scroll=3200]
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const hit = args.find((a) => a.startsWith("--scroll="));
const SCROLL = hit ? Number(hit.slice(9)) : 3200;

const PROBE = `
  (() => {
    const root = document.querySelector(".light-path");
    if (!root) return JSON.stringify({ error: "no .light-path in the document" });

    const svgs = [...root.querySelectorAll("svg")];
    const groups = [...root.querySelectorAll("g")].map((g) => {
      const cs = getComputedStyle(g);
      const bb = g.getBoundingClientRect();
      return {
        cls: g.getAttribute("class"),
        filter: cs.filter,
        opacity: cs.opacity,
        display: cs.display,
        paths: g.querySelectorAll("path").length,
        box: [Math.round(bb.width), Math.round(bb.height)],
      };
    });

    const strands = [...root.querySelectorAll("path.light-path__strand")].map((p) => {
      const cs = getComputedStyle(p);
      return {
        stroke: p.getAttribute("stroke"),
        width: p.getAttribute("stroke-width"),
        opacity: p.getAttribute("opacity"),
        filter: cs.filter,
        dLen: (p.getAttribute("d") || "").length,
      };
    });

    const curtain = root.querySelector(".light-path__curtain");
    const rig = root.querySelector(".light-path__comet-rig");
    const cs = (el) => (el ? getComputedStyle(el) : null);

    return JSON.stringify({
      rootStyle: {
        display: getComputedStyle(root).display,
        opacity: getComputedStyle(root).opacity,
        blend: getComputedStyle(root).mixBlendMode,
        contain: getComputedStyle(root).contain,
      },
      svgCount: svgs.length,
      svgSizes: svgs.map((s) => [s.getAttribute("width"), s.getAttribute("height")]),
      groups,
      strandCount: strands.length,
      strandSample: strands.slice(0, 3),
      defsGradients: [...root.querySelectorAll("linearGradient, radialGradient")].map((g) => g.id),
      curtain: curtain
        ? { transform: cs(curtain).transform, display: cs(curtain).display }
        : null,
      rig: rig
        ? {
            transform: cs(rig).transform,
            transformOrigin: cs(rig).transformOrigin,
            opacity: cs(rig).opacity,
            visibility: cs(rig).visibility,
            willChange: cs(rig).willChange,
          }
        : null,
      scrollY: window.scrollY,
      docHeight: document.documentElement.scrollHeight,
    });
  })()
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
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(9000);

    await cdp.send(
      "Runtime.evaluate",
      { expression: `window.scrollTo(0, ${SCROLL}); "ok"`, returnByValue: true },
      sessionId
    );
    await sleep(2500);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );

    console.log(`\n${URL_ARG}  at scroll ${SCROLL}\n`);
    console.log(JSON.stringify(JSON.parse(result.value), null, 2));
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
