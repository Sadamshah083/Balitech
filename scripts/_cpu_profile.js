/**
 * Hottest call frames on the main thread during load.
 *
 *   node scripts/_cpu_profile.js [url] [--cpu=4] [--for=6000]
 *
 * `_js_cost.js` says which bundle the time is in; this says which functions.
 * The home page's scored LCP is set entirely by Lighthouse's CPU model — every
 * request finishes inside 300ms — so this is the measurement that decides what
 * is worth changing. It is what found the footer QR code generating itself on
 * the main thread of every page load.
 *
 * Self time is attributed bottom-up, then also rolled up per source file, since
 * minified React frames are only meaningful in aggregate.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const CPU = Number(flag("cpu", 4));
const DURATION = Number(flag("for", 6000));

(async () => {
  const chrome = await launch({ port: 9600 + (process.pid % 300) });

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
    await cdp.send("Profiler.enable", {}, sessionId);
    await cdp.send("Profiler.setSamplingInterval", { interval: 200 }, sessionId);
    await cdp.send("Profiler.start", {}, sessionId);

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(DURATION);

    const { profile } = await cdp.send("Profiler.stop", {}, sessionId);
    cdp.close();

    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const selfTime = new Map();

    /* timeDeltas[i] is the gap before samples[i], so each sample is billed the
       time that preceded it. */
    for (let i = 0; i < profile.samples.length; i++) {
      const id = profile.samples[i];
      const dt = (profile.timeDeltas[i] ?? 0) / 1000;
      if (dt > 0) selfTime.set(id, (selfTime.get(id) ?? 0) + dt);
    }

    const label = (node) => {
      const f = node.callFrame;
      const name = f.functionName || "(anonymous)";
      const file = (f.url || "").split("/").pop() || "(no url)";
      return `${name}  ${file}:${f.lineNumber + 1}`;
    };

    const frames = [...selfTime.entries()]
      .map(([id, ms]) => ({ ms, node: byId.get(id) }))
      .filter((f) => f.node)
      .sort((a, b) => b.ms - a.ms);

    const total = frames.reduce((a, f) => a + f.ms, 0);
    const script = frames
      .filter((f) => f.node.callFrame.url)
      .reduce((a, f) => a + f.ms, 0);

    console.log(
      `\n${URL_ARG}   ${CPU}x CPU, profiled ${DURATION}ms\n` +
        `${total.toFixed(0)}ms sampled, ${script.toFixed(0)}ms of it in page scripts\n`
    );
    console.log("self ms    share  frame");
    for (const f of frames.slice(0, 24)) {
      if (f.ms < 8) break;
      const pct = ((f.ms / total) * 100).toFixed(1);
      console.log(`${f.ms.toFixed(0).padStart(7)}  ${pct.padStart(6)}%  ${label(f.node).slice(0, 92)}`);
    }

    const byFile = new Map();
    for (const f of frames) {
      const url = f.node.callFrame.url || "(browser internals)";
      const key = url.split("/").pop() || url;
      byFile.set(key, (byFile.get(key) ?? 0) + f.ms);
    }

    console.log("\nrolled up per source\n");
    console.log("self ms    share  source");
    for (const [file, ms] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
      const pct = ((ms / total) * 100).toFixed(1);
      console.log(`${ms.toFixed(0).padStart(7)}  ${pct.padStart(6)}%  ${file.slice(0, 78)}`);
    }
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
