/**
 * Reports what the largest contentful paint actually is, and when.
 *
 *   node scripts/_lcp.js [url] [--desktop]
 *
 * Lighthouse's own LCP-element audit changed shape between versions and stopped
 * printing, and its phase breakdown is simulated from the network graph rather
 * than observed. This watches the real PerformanceObserver entries under the
 * same emulation Lighthouse uses, so the element and its timing are measured.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3300/";
const DESKTOP = args.includes("--desktop");
/* Paint with scripts disabled. If the first paint arrives much earlier this
   way, the delay is script execution rather than the CSS/font/HTML path. */
const NOJS = args.includes("--nojs");

/* Matches Lighthouse's mobile and desktop presets. */
const EMU = DESKTOP
  ? { width: 1350, height: 940, dsf: 1, mobile: false, cpu: 1, down: -1, up: -1, rtt: 0 }
  : {
      width: 412,
      height: 823,
      dsf: 1.75,
      mobile: true,
      cpu: 4,
      down: (1.6 * 1024 * 1024) / 8,
      up: (750 * 1024) / 8,
      rtt: 150,
    };

const WATCH = `
  window.__lcp = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__lcp.push({
        start: e.startTime,
        size: e.size,
        url: e.url || "",
        tag: e.element ? e.element.tagName : "",
        cls: e.element ? String(e.element.className || "").slice(0, 90) : "",
        text: e.element ? (e.element.textContent || "").trim().slice(0, 70) : "",
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });

  window.__paints = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__paints.push({ name: e.name, start: e.startTime });
  }).observe({ type: "paint", buffered: true });
`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    /* Reported by the browser rather than by page script, so it still works
       when script execution is disabled. */
    await cdp.send("Performance.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: EMU.width, height: EMU.height, deviceScaleFactor: EMU.dsf, mobile: EMU.mobile },
      sessionId
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: EMU.cpu }, sessionId);
    if (EMU.down > 0) {
      await cdp.send(
        "Network.emulateNetworkConditions",
        { offline: false, latency: EMU.rtt, downloadThroughput: EMU.down, uploadThroughput: EMU.up },
        sessionId
      );
    }
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: WATCH }, sessionId);
    if (NOJS) {
      /* The observer above is installed before this takes effect, so paint
         timings are still reported even with page scripts blocked. */
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
    }

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DESKTOP ? 6000 : 12000);

    const { metrics } = await cdp.send("Performance.getMetrics", {}, sessionId);
    const metric = (name) => metrics.find((m) => m.name === name)?.value;
    const navStart = metric("NavigationStart");
    /* Chrome exposes FirstMeaningfulPaint here but not FCP; close enough to
       compare the same page against itself with and without scripts. */
    const fmpAbs = metric("FirstMeaningfulPaint");

    console.log(`\n${DESKTOP ? "DESKTOP" : "MOBILE"}  ${URL_ARG}${NOJS ? "   [scripts disabled]" : ""}\n`);
    if (navStart && fmpAbs) {
      console.log(`   browser-reported paint  ${(fmpAbs - navStart).toFixed(2)}s`);
    }
    console.log(
      `   layout ${(metric("LayoutDuration") ?? 0).toFixed(3)}s over ${metric("LayoutCount") ?? "?"} passes` +
        `, style recalc ${(metric("RecalcStyleDuration") ?? 0).toFixed(3)}s` +
        `, script ${(metric("ScriptDuration") ?? 0).toFixed(3)}s`
    );
    console.log(`   ${metric("Nodes") ?? "?"} nodes, ${metric("LayoutObjects") ?? "?"} layout objects`);

    if (NOJS) {
      console.log("");
      return;
    }

    const { result } = await cdp.send(
      "Runtime.evaluate",
      {
        expression: `JSON.stringify({ lcp: window.__lcp || [], paints: window.__paints || [] })`,
        returnByValue: true,
      },
      sessionId
    );
    const { lcp, paints } = JSON.parse(result.value);

    for (const p of paints) {
      console.log(`   ${p.name.padEnd(24)} ${(p.start / 1000).toFixed(2)}s`);
    }

    console.log("\nLCP candidates, in the order they were promoted");
    for (const e of lcp) {
      const what = e.url ? e.url.split("/").pop() : `<${e.tag.toLowerCase()}> ${e.text}`;
      console.log(
        `   ${(e.start / 1000).toFixed(2)}s  area ${String(e.size).padStart(7)}  ${what}`
      );
      if (e.cls) console.log(`            class="${e.cls}"`);
    }

    const final = lcp[lcp.length - 1];
    if (final) {
      console.log(
        `\n   final LCP ${(final.start / 1000).toFixed(2)}s  ->  ${
          final.url ? final.url.split("/").pop() : `<${final.tag.toLowerCase()}> "${final.text}"`
        }\n`
      );
    } else {
      console.log("\n   no LCP entries captured\n");
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
