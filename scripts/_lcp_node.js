/**
 * What the browser itself picks as the largest contentful paint, and when.
 *
 *   node scripts/_lcp_node.js [url] [--cpu=4] [--for=8000]
 *
 * Lighthouse reports a *simulated* LCP, and its audit often cannot name the
 * element. This uses PerformanceObserver in the page, so it reports every
 * candidate the browser promoted in order — which is the only way to know
 * whether the number is being set by the intro overlay, the hero copy, or an
 * image.
 *
 * Halving the intro moved the scored LCP by 0.03s, so the two views of the same
 * metric clearly disagree and both are worth being able to see.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const CPU = Number(flag("cpu", 4));
const DURATION = Number(flag("for", 8000));

/* Registered before anything else runs, with buffered: true so candidates that
   were promoted before this executed are still delivered. */
const COLLECT = `
  window.__lcp = [];
  window.__paints = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__lcp.push({
        at: Math.round(e.startTime),
        size: e.size,
        tag: e.element ? e.element.tagName.toLowerCase() : null,
        cls: e.element ? String(e.element.className || "").slice(0, 70) : null,
        text: e.element ? (e.element.textContent || "").trim().slice(0, 60) : null,
        url: e.url || null,
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });

  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__paints.push({ name: e.name, at: Math.round(e.startTime) });
    }
  }).observe({ type: "paint", buffered: true });
`;

(async () => {
  const chrome = await launch({ port: 9700 + (process.pid % 200) });

  try {
    const cdp = connect(chrome.wsUrl);
    await cdp.ready;

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 412, height: 915, deviceScaleFactor: 2, mobile: true },
      sessionId
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: COLLECT }, sessionId);
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DURATION);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      {
        expression: `JSON.stringify({
          lcp: window.__lcp,
          paints: window.__paints,
          nav: Math.round(performance.getEntriesByType("navigation")[0]?.loadEventEnd ?? 0),
        })`,
        returnByValue: true,
      },
      sessionId
    );
    cdp.close();

    const { lcp, paints, nav } = JSON.parse(result.value);

    console.log(`\n${URL_ARG}   ${CPU}x CPU\n`);
    for (const p of paints) console.log(`   ${String(p.at).padStart(5)} ms  ${p.name}`);
    console.log(`   ${String(nav).padStart(5)} ms  load event end`);

    console.log(`\nLCP candidates, in the order the browser promoted them\n`);
    console.log("     at    size  element");
    for (const c of lcp) {
      const what = c.url
        ? c.url.split("/").pop()
        : `${c.tag}.${(c.cls || "").split(/\s+/)[0]}  "${(c.text || "").slice(0, 34)}"`;
      console.log(`   ${String(c.at).padStart(5)}  ${String(c.size).padStart(6)}  ${what.slice(0, 76)}`);
    }
    if (lcp.length) console.log(`\n   final: ${lcp[lcp.length - 1].at} ms`);
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
