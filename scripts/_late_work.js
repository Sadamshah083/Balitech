/**
 * Lists everything a page does after it should have finished doing anything.
 *
 *   node scripts/_late_work.js [url] [--cpu=8] [--after=3000] [--seconds=14]
 *
 * A load trace showed this site still evaluating script and running React's
 * scheduler ten seconds in, with no one touching it. Ranked event names say
 * that is happening but not what is responsible, so this records the two things
 * that can be attributed: every network request that starts late, and every
 * long task that runs late.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org/";
const num = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const CPU = num("cpu", 8);
const AFTER = num("after", 3000);
const SECONDS = num("seconds", 14);

const OBSERVE = `
  window.__late = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__late.push({
        start: Math.round(e.startTime),
        dur: Math.round(e.duration),
        attribution: (e.attribution || []).map((a) => a.name + ":" + (a.containerName || a.containerId || a.containerSrc || "")).join(" | "),
      });
    }
  }).observe({ type: "longtask", buffered: true });
`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const requests = [];
  let t0 = 0;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE }, sessionId);

    cdp.on("Network.requestWillBeSent", (p) => {
      if (!t0) t0 = p.timestamp;
      requests.push({
        at: Math.round((p.timestamp - t0) * 1000),
        url: p.request.url,
        type: p.type,
        initiator: p.initiator?.type,
        stack: (p.initiator?.stack?.callFrames || [])
          .slice(0, 2)
          .map((f) => `${(f.url || "").split("/").pop()}:${f.lineNumber}`)
          .join(" < "),
      });
    });

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(SECONDS * 1000);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: "window.__late", returnByValue: true },
      sessionId
    );
    const tasks = (result.value || []).filter((t) => t.start > AFTER);

    const short = (u) => {
      try {
        const p = new URL(u);
        return p.pathname.length > 58 ? "…" + p.pathname.slice(-57) : p.pathname;
      } catch {
        return u.slice(0, 58);
      }
    };

    const late = requests.filter((r) => r.at > AFTER);
    console.log(`\n${URL_ARG}   cpu x${CPU}, watching ${SECONDS}s\n`);
    console.log(`=== ${late.length} network requests started after ${AFTER}ms ===`);
    for (const r of late.slice(0, 30)) {
      console.log(
        `   ${String(r.at).padStart(6)}ms  ${String(r.type).padEnd(10)} ${short(r.url)}` +
          (r.stack ? `\n            from ${r.initiator} ${r.stack}` : ` (${r.initiator})`)
      );
    }
    if (!late.length) console.log("   (none)");

    const blocking = tasks.reduce((n, t) => n + Math.max(0, t.dur - 50), 0);
    console.log(`\n=== ${tasks.length} long tasks after ${AFTER}ms, ${blocking}ms of blocking ===`);
    for (const t of tasks.slice(0, 20)) {
      console.log(`   ${String(t.start).padStart(6)}ms  ${String(t.dur).padStart(5)}ms  ${t.attribution || "(unattributed)"}`);
    }
    console.log("");
  } finally {
    chrome.stop();
  }
})();
