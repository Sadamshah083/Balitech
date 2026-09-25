/**
 * Records a Chrome trace of a page *load* and says where the main thread went.
 *
 *   node scripts/_boot_trace.js [url] [--cpu=4] [--mobile] [--seconds=10]
 *
 * Lighthouse buckets its main-thread total into a handful of groups, and on
 * this site the biggest of them is "Other" — which names nothing. This ranks
 * the raw trace events instead, so whatever is actually filling that bucket has
 * to identify itself. Self time, not wall time, so a long parent task is not
 * credited with the work of its children.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const MOBILE = args.includes("--mobile");
const num = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const CPU = num("cpu", MOBILE ? 4 : 4);
const SECONDS = num("seconds", 10);

const CATEGORIES = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "blink",
  "blink.user_timing",
  "cc",
  "gpu",
].join(",");

/* Trace phases: complete events carry a duration, begin/end events have to be
   paired up. Only the first are needed for a ranking of this kind. */
const isComplete = (e) => e.ph === "X" && typeof e.dur === "number";

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const events = [];
  cdp.on("Tracing.dataCollected", (p) => {
    if (p.value) events.push(...p.value);
  });
  let onDone = () => {};
  const tracingComplete = new Promise((resolve) => {
    onDone = resolve;
  });
  cdp.on("Tracing.tracingComplete", () => onDone());

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      MOBILE
        ? { width: 412, height: 823, deviceScaleFactor: 1.75, mobile: true }
        : { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);

    await cdp.send("Tracing.start", { categories: CATEGORIES, transferMode: "ReportEvents" });
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(SECONDS * 1000);
    await cdp.send("Tracing.end");
    await tracingComplete;

    /* The renderer main thread is the one with the navigation on it; picking it
       by name keeps compositor and raster threads out of the ranking. */
    const main = events.filter(
      (e) => isComplete(e) && e.dur > 0 && (e.name !== "RunTask" || true)
    );

    const byName = new Map();
    for (const e of main) {
      const cur = byName.get(e.name) || { total: 0, n: 0, max: 0 };
      cur.total += e.dur;
      cur.n += 1;
      cur.max = Math.max(cur.max, e.dur);
      byName.set(e.name, cur);
    }

    const rows = [...byName.entries()]
      .map(([name, v]) => ({ name, ms: v.total / 1000, n: v.n, max: v.max / 1000 }))
      .sort((a, b) => b.ms - a.ms);

    console.log(`\n${MOBILE ? "MOBILE" : "DESKTOP"} load trace  ${URL_ARG}   cpu x${CPU}, ${SECONDS}s\n`);
    console.log("   total ms   count   longest   event");
    console.log("   ─────────────────────────────────────────────────────────────");
    for (const r of rows.slice(0, 24)) {
      console.log(
        `   ${r.ms.toFixed(0).padStart(8)}  ${String(r.n).padStart(6)}  ${r.max
          .toFixed(0)
          .padStart(7)}   ${r.name}`
      );
    }

    /* Anything that runs over and over after the page has settled is a running
       animation rather than start-up cost, and is worth separating out. */
    const nav = events.find((e) => e.name === "navigationStart");
    const t0 = nav ? nav.ts : Math.min(...events.filter((e) => e.ts).map((e) => e.ts));
    const late = main.filter((e) => (e.ts - t0) / 1000 > 5000);
    const lateByName = new Map();
    for (const e of late) {
      lateByName.set(e.name, (lateByName.get(e.name) || 0) + e.dur);
    }
    const lateRows = [...lateByName.entries()]
      .map(([name, ms]) => ({ name, ms: ms / 1000 }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10);
    if (lateRows.length) {
      console.log("\n   still running after 5s (per second of idle time)");
      for (const r of lateRows) {
        const perSec = r.ms / Math.max(1, SECONDS - 5);
        if (perSec < 1) continue;
        console.log(`   ${perSec.toFixed(0).padStart(8)} ms/s   ${r.name}`);
      }
    }
    console.log("");
  } finally {
    chrome.stop();
  }
})();
