/**
 * Finds the code that forces synchronous layout during page load.
 *
 *   node scripts/_reflow.js [url] [--desktop]
 *
 * Reading a geometry property after the DOM has been touched makes the browser
 * lay out immediately rather than at the next frame, and doing it repeatedly is
 * what turns one layout pass into dozens. Lighthouse reports that a "forced
 * reflow" happened but not who caused it, so this wraps the properties that
 * trigger one and keeps the stack that read them.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org/";
const DESKTOP = args.includes("--desktop");

const SHIM = `
(() => {
  window.__reflows = [];
  const record = (what) => {
    const stack = (new Error().stack || "").split("\\n").slice(2, 7).join(" | ");
    window.__reflows.push({ what, at: performance.now(), stack });
  };

  /* Layout-forcing reads, per the browser's own list. */
  const elementProps = [
    "offsetWidth", "offsetHeight", "offsetTop", "offsetLeft",
    "clientWidth", "clientHeight", "clientTop", "clientLeft",
    "scrollWidth", "scrollHeight",
  ];

  for (const prop of elementProps) {
    for (const proto of [Element.prototype, HTMLElement.prototype]) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (!desc || !desc.get) continue;
      Object.defineProperty(proto, prop, {
        configurable: true,
        enumerable: desc.enumerable,
        get() {
          record(prop);
          return desc.get.call(this);
        },
      });
      break;
    }
  }

  for (const proto of [Element.prototype, Range.prototype]) {
    for (const name of ["getBoundingClientRect", "getClientRects"]) {
      const orig = proto[name];
      if (typeof orig !== "function") continue;
      proto[name] = function (...a) {
        record(name);
        return orig.apply(this, a);
      };
    }
  }

  const gcs = window.getComputedStyle;
  window.getComputedStyle = function (...a) {
    record("getComputedStyle");
    return gcs.apply(window, a);
  };
})();
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

    if (!DESKTOP) {
      await cdp.send(
        "Emulation.setDeviceMetricsOverride",
        { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true },
        sessionId
      );
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 }, sessionId);
    }

    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: SHIM }, sessionId);
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DESKTOP ? 8000 : 14000);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: `JSON.stringify(window.__reflows || [])`, returnByValue: true },
      sessionId
    );
    const events = JSON.parse(result.value);

    console.log(`\n${DESKTOP ? "DESKTOP" : "MOBILE"}  ${URL_ARG}`);
    console.log(`${events.length} layout-forcing reads during load\n`);

    const byProp = {};
    for (const e of events) byProp[e.what] = (byProp[e.what] || 0) + 1;
    console.log("by property");
    for (const [k, v] of Object.entries(byProp).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${String(v).padStart(5)}  ${k}`);
    }

    /* Grouped by the frame that did the reading, which is what identifies the
       component rather than the property it happened to touch. */
    const byCaller = {};
    for (const e of events) {
      const frame =
        (e.stack.match(/(?:at\s+)?([^\s|(]*\/_next\/static\/chunks\/[^\s|)]+)/) || [])[1] ||
        e.stack.split("|")[0].trim() ||
        "(unknown)";
      const key = frame.replace(/^https?:\/\/[^/]+/, "").slice(0, 96);
      byCaller[key] = byCaller[key] || { n: 0, props: new Set(), first: e.at, last: e.at };
      byCaller[key].n++;
      byCaller[key].props.add(e.what);
      byCaller[key].last = e.at;
    }

    console.log("\nby caller");
    for (const [k, v] of Object.entries(byCaller)
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 12)) {
      console.log(
        `   ${String(v.n).padStart(5)}  ${(v.first / 1000).toFixed(2)}s-${(v.last / 1000).toFixed(2)}s  [${[
          ...v.props,
        ]
          .slice(0, 4)
          .join(", ")}]`
      );
      console.log(`          ${k}`);
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
