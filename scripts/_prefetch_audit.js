/**
 * Counts what the App Router fetches on its own while a page is read.
 *
 *   node scripts/_prefetch_audit.js [url] [--desktop]
 *
 * Every `<Link>` to a static route is prefetched when it scrolls into view, so
 * a page with a lot of links quietly pulls a flight payload per destination
 * while the visitor is scrolling — network, and a parse on the main thread, for
 * a navigation that may never happen. This reports them grouped by destination
 * so it is obvious which links are worth prefetching and which are not.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const DESKTOP = args.includes("--desktop");

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

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
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

    const reqs = new Map();
    cdp.on("Network.requestWillBeSent", (p) => {
      const headers = p.request?.headers || {};
      const named = (name) =>
        Object.entries(headers).find(([h]) => h.toLowerCase() === name)?.[1];
      /* The router marks its own fetches: `RSC: 1` on any flight request and
         `Next-Router-Prefetch: 1` when it is speculative rather than a real
         navigation. Chrome adds `Sec-Purpose: prefetch` for the same reason. */
      const isPrefetch = Boolean(
        named("next-router-prefetch") ||
          named("rsc") ||
          String(named("sec-purpose") || "").includes("prefetch")
      );
      reqs.set(p.requestId, { url: p.request.url, prefetch: isPrefetch, bytes: 0 });
    });
    cdp.on("Network.loadingFinished", (p) => {
      const r = reqs.get(p.requestId);
      if (r) r.bytes = p.encodedDataLength || 0;
    });

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DESKTOP ? 7000 : 14000);

    const atLoad = [...reqs.values()].filter((r) => r.prefetch).length;

    // Read the page the way a visitor does, so viewport-triggered prefetches fire.
    await cdp.send(
      "Runtime.evaluate",
      {
        expression: `(async () => {
          const step = Math.round(innerHeight * 0.8);
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 300));
          }
        })()`,
        awaitPromise: true,
      },
      sessionId
    );
    await sleep(4000);

    const all = [...reqs.values()];
    const pf = all.filter((r) => r.prefetch);
    const bytes = pf.reduce((n, r) => n + r.bytes, 0);

    console.log(`\n${DESKTOP ? "DESKTOP" : "MOBILE"}  ${URL_ARG}\n`);
    console.log(`   router prefetches       ${pf.length}`);
    console.log(`      before scrolling     ${atLoad}`);
    console.log(`      during scrolling     ${pf.length - atLoad}`);
    console.log(`   bytes they cost         ${(bytes / 1024).toFixed(1)} KB`);
    console.log(`   all requests            ${all.length}\n`);

    if (pf.length) {
      const byPath = new Map();
      for (const r of pf) {
        let p;
        try {
          p = new URL(r.url).pathname;
        } catch {
          p = r.url;
        }
        const e = byPath.get(p) || { n: 0, bytes: 0 };
        e.n += 1;
        e.bytes += r.bytes;
        byPath.set(p, e);
      }
      console.log("   destination                              times       KB");
      console.log("   ──────────────────────────────────────────────────────────");
      for (const [p, e] of [...byPath.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
        console.log(
          `   ${p.slice(0, 38).padEnd(38)}  ${String(e.n).padStart(5)}  ${(e.bytes / 1024)
            .toFixed(1)
            .padStart(7)}`
        );
      }
      console.log("");
    }
  } finally {
    chrome.stop();
  }
})();
