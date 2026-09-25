/**
 * Request waterfall up to first paint, under Lighthouse-like mobile throttling.
 *
 *   node scripts/_waterfall.js [url] [--desktop] [--all]
 *
 * Lighthouse reports FCP and LCP from a simulation of the network graph, which
 * can show a large gap between them that applied throttling does not reproduce.
 * This uses real throttling and real timings, so what is actually holding up the
 * first paint is visible: by default only requests that finish before it, since
 * those are the critical path.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3300/";
const DESKTOP = args.includes("--desktop");
const ALL = args.includes("--all");

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

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const requests = new Map();

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    cdp.on("Network.requestWillBeSent", (p) => {
      requests.set(p.requestId, {
        url: p.request.url,
        type: p.type,
        priority: p.request.initialPriority,
        start: p.timestamp,
        bytes: 0,
      });
    });
    cdp.on("Network.responseReceived", (p) => {
      const r = requests.get(p.requestId);
      if (r) {
        r.type = p.type || r.type;
        r.status = p.response.status;
        r.mime = p.response.mimeType;
        r.protocol = p.response.protocol;
        r.encoding = p.response.headers?.["content-encoding"] || p.response.headers?.["Content-Encoding"] || "";
      }
    });
    cdp.on("Network.loadingFinished", (p) => {
      const r = requests.get(p.requestId);
      if (r) {
        r.end = p.timestamp;
        r.bytes = p.encodedDataLength || 0;
      }
    });

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
    await cdp.send(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source: `
          window.__fp = null;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) {
              if (e.name === "first-contentful-paint" && window.__fp === null) window.__fp = e.startTime;
            }
          }).observe({ type: "paint", buffered: true });
        `,
      },
      sessionId
    );

    const t0 = Date.now();
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DESKTOP ? 7000 : 14000);
    void t0;

    const { result } = await cdp.send(
      "Runtime.evaluate",
      {
        expression: `JSON.stringify({
          fcp: window.__fp,
          nav: performance.getEntriesByType("navigation")[0]?.startTime ?? 0,
          origin: performance.timeOrigin,
        })`,
        returnByValue: true,
      },
      sessionId
    );
    const { fcp } = JSON.parse(result.value);

    const list = [...requests.values()].filter((r) => r.end);
    if (!list.length) throw new Error("no requests captured");
    const navStart = Math.min(...list.map((r) => r.start));
    const fcpAbs = fcp === null ? Infinity : navStart + fcp / 1000;

    const rows = list
      .map((r) => ({
        ...r,
        rel: (r.start - navStart) * 1000,
        done: (r.end - navStart) * 1000,
      }))
      .sort((a, b) => a.done - b.done);

    const critical = rows.filter((r) => r.end <= fcpAbs + 0.02);
    const shown = ALL ? rows : critical;

    console.log(`\n${DESKTOP ? "DESKTOP" : "MOBILE"}  ${URL_ARG}`);
    console.log(`first contentful paint at ${fcp === null ? "?" : (fcp / 1000).toFixed(2) + "s"}`);
    console.log(
      `${critical.length} of ${rows.length} requests finish before it, ${(
        critical.reduce((s, r) => s + r.bytes, 0) / 1024
      ).toFixed(0)} KiB on the wire\n`
    );

    console.log("  start    done    size  prio      type        resource");
    for (const r of shown) {
      const name = (() => {
        try {
          const u = new URL(r.url);
          const f = u.pathname.split("/").pop() || u.pathname;
          return (f.length > 40 ? f.slice(0, 39) + "…" : f) + (u.search ? "?…" : "");
        } catch {
          return r.url.slice(0, 40);
        }
      })();
      console.log(
        `  ${(r.rel / 1000).toFixed(2)}s  ${(r.done / 1000).toFixed(2)}s  ${(r.bytes / 1024)
          .toFixed(0)
          .padStart(4)}K  ${String(r.priority || "").padEnd(9)} ${String(r.type || "").padEnd(11)} ${name}`
      );
    }

    const byType = {};
    for (const r of critical) {
      byType[r.type] = byType[r.type] || { n: 0, bytes: 0 };
      byType[r.type].n++;
      byType[r.type].bytes += r.bytes;
    }
    console.log("\ncritical path by resource type");
    for (const [t, v] of Object.entries(byType).sort((a, b) => b[1].bytes - a[1].bytes)) {
      console.log(`   ${t.padEnd(12)} ${v.n} requests, ${(v.bytes / 1024).toFixed(0)} KiB`);
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
