/**
 * Lists a page's top-level sections with their height and position relative to
 * the fold, and whether they already skip off-screen rendering work.
 *
 *   node scripts/_sections.js url [url ...] [--width=412]
 *
 * `content-visibility: auto` is only worth applying to what is below the fold,
 * and only pays for itself on tall subtrees, so this reports both.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URLS = args.filter((a) => !a.startsWith("--"));
const WIDTH = Number((args.find((a) => a.startsWith("--width=")) || "--width=412").slice(8));
const HEIGHT = Number((args.find((a) => a.startsWith("--height=")) || "--height=823").slice(9));

const PROBE = `JSON.stringify((() => {
  const main = document.querySelector("main") || document.body;
  const rows = [];
  const walk = (parent, depth) => {
    for (const el of parent.children) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.height < 200) continue;
      rows.push({
        depth,
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || "").slice(0, 70),
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        nodes: el.querySelectorAll("*").length,
        cv: cs.contentVisibility,
      });
      if (depth < 1) walk(el, depth + 1);
    }
  };
  walk(main, 0);
  return {
    docHeight: Math.round(document.documentElement.scrollHeight),
    viewport: window.innerHeight,
    totalNodes: document.querySelectorAll("*").length,
    rows,
  };
})())`;

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
      { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: true },
      sessionId
    );

    for (const url of URLS) {
      await cdp.send("Page.navigate", { url }, sessionId);
      await sleep(3500);
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression: PROBE, returnByValue: true },
        sessionId
      );
      const data = JSON.parse(result.value);

      console.log(`\n${url}`);
      console.log(
        `   document ${data.docHeight}px tall, ${data.totalNodes} nodes, viewport ${data.viewport}px`
      );
      let belowNodes = 0;
      let skipped = 0;
      console.log("\n   top    height  nodes  skips?  section");
      for (const r of data.rows) {
        const below = r.top > data.viewport;
        if (below && r.depth === 0) belowNodes += r.nodes;
        if (below && r.depth === 0 && r.cv === "auto") skipped += r.nodes;
        console.log(
          `   ${String(r.top).padStart(5)}  ${String(r.height).padStart(6)}  ${String(r.nodes).padStart(5)}  ${
            r.cv === "auto" ? "  yes " : below ? "  NO  " : "  n/a "
          }  ${"  ".repeat(r.depth)}${r.tag}.${r.cls}`
        );
      }
      console.log(
        `\n   below the fold: ${belowNodes} nodes, of which ${skipped} skip rendering (${
          belowNodes ? Math.round((skipped / belowNodes) * 100) : 0
        }%)`
      );
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
