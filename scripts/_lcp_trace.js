/**
 * Records every LCP candidate the browser reports, with the element behind it.
 *
 *   node scripts/_lcp_trace.js [url] [--cpu=4] [--net=slow4g|none]
 *
 * Lighthouse only shows the winning candidate, which is useless when the
 * question is "what made the winner arrive so late". Seeing the whole sequence
 * tells you whether an element was late to paint or simply out-sized by
 * something that appeared later.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const CPU = Number(flag("cpu", 4));
const NET = flag("net", "slow4g");
const PORT = 9351;

const CHROME_CANDIDATES = [
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Edge binary found");
  return found;
}

async function getTargetUrl() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome did not expose its debugging port");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    close: () => ws.close(),
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
  };
}

const COLLECTOR = `
  window.__lcp = [];
  window.__paint = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const el = e.element;
      window.__lcp.push({
        t: Math.round(e.startTime),
        size: e.size,
        url: e.url || "",
        tag: el ? el.tagName.toLowerCase() : "(gone)",
        cls: el ? (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || "")).slice(0, 70) : "",
        text: el ? (el.textContent || "").trim().slice(0, 50) : "",
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__paint.push({ name: e.name, t: Math.round(e.startTime) });
  }).observe({ type: "paint", buffered: true });
`;

(async () => {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--disable-extensions",
      "--autoplay-policy=no-user-gesture-required",
      "--force-device-scale-factor=1",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-lcp-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (m, p) => cdp.send(m, p, sessionId);

  await send("Page.enable");
  await send("Network.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 412,
    height: 823,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Emulation.setCPUThrottlingRate", { rate: CPU });
  if (args.includes("--nojs")) {
    // Categorical check: whatever still paints here does not depend on
    // hydration, which is the only question a loaded dev machine can answer
    // reliably.
    await send("Emulation.setScriptExecutionDisabled", { value: true });
  }
  if (NET === "slow4g") {
    await send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }
  await send("Page.addScriptToEvaluateOnNewDocument", { source: COLLECTOR });

  await send("Page.navigate", { url: URL_ARG });
  await sleep(14000);

  const read = async (expr) => {
    const { result } = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: false,
    });
    return result.value;
  };

  if (args.includes("--shot")) {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const file = path.join(process.cwd(), "tmp", "loader-nojs.png");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(data, "base64"));
    console.log(`\nscreenshot: ${file}`);
  }

  const lcp = await read("JSON.parse(JSON.stringify(window.__lcp || []))");
  const paint = await read("JSON.parse(JSON.stringify(window.__paint || []))");

  console.log(`\n${URL_ARG}   cpu ${CPU}x   net ${NET}\n`);
  console.log("paint");
  for (const p of paint) console.log(`   ${String(p.t).padStart(6)} ms  ${p.name}`);

  console.log("\nLCP candidates (last one wins)");
  for (const c of lcp) {
    console.log(
      `   ${String(c.t).padStart(6)} ms  size ${String(c.size).padStart(7)}  <${c.tag}> ${c.cls}`
    );
    if (c.text) console.log(`               "${c.text}"`);
    if (c.url) console.log(`               ${c.url.slice(-60)}`);
  }

  cdp.close();
  chrome.kill();
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
