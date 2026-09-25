/**
 * Measures what each page actually pulls over the wire.
 *
 *   node scripts/_check_perf.js [origin] [--w=1440]
 *
 * Lighthouse scores move around too much between runs to be useful as a
 * regression signal. Transferred bytes per resource type do not, so that is
 * what this reports, along with the heaviest individual responses — which is
 * where every regression on this site has come from so far.
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

const ORIGIN = args.find((a) => !a.startsWith("--")) || "http://localhost:3200";
const WIDTH = Number(flag("w", 1440));
const HEIGHT = Number(flag("h", 950));
const SETTLE = Number(flag("settle", 6000));
const PORT = 9340;

const PAGES = [
  "/",
  "/services",
  "/about",
  "/our-team",
  "/gallery",
  "/blog",
  "/join-us",
  "/our-offices",
];

/** Anything at or above this is worth a second look. */
const HEAVY_BYTES = 400 * 1024;

const CHROME_CANDIDATES = [
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

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
  const listeners = new Set();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method) {
      for (const fn of listeners) fn(msg);
      return;
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    close: () => ws.close(),
    on: (fn) => listeners.add(fn),
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
  };
}

(async () => {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required",
      "--force-device-scale-factor=1",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-perf-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Target.activateTarget", { targetId });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 700 },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);

  /** @type {Map<string, {type: string, url: string, bytes: number}>} */
  let inflight = new Map();

  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;

    if (msg.method === "Network.responseReceived") {
      const { requestId, type, response } = msg.params;
      inflight.set(requestId, { type, url: response.url, bytes: 0 });
    }
    if (msg.method === "Network.loadingFinished") {
      const entry = inflight.get(msg.params.requestId);
      if (entry) entry.bytes = msg.params.encodedDataLength;
    }
  });

  const rows = [];

  for (const page of PAGES) {
    inflight = new Map();

    /* An empty cache each time, otherwise the first page pays for the fonts and
       every page after it looks weightless. */
    await cdp.send("Network.clearBrowserCache", {}, sessionId);
    await cdp.send("Page.navigate", { url: `${ORIGIN}${page}` }, sessionId);
    await sleep(SETTLE);

    /* Walk the page so lazy images below the fold are counted too. */
    await cdp.send(
      "Runtime.evaluate",
      {
        expression: `(async () => {
          document.documentElement.style.scrollBehavior = "auto";
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 90));
          }
          window.scrollTo(0, 0);
        })()`,
        awaitPromise: true,
      },
      sessionId
    );
    await sleep(2500);

    const assets = [...inflight.values()].filter((a) => a.bytes > 0);
    const byType = {};
    let total = 0;

    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] ?? 0) + asset.bytes;
      total += asset.bytes;
    }

    rows.push({ page, total, byType, assets });
  }

  console.log(`\nperf probe — ${ORIGIN} @ ${WIDTH}px\n`);
  console.log("page             total     image     script    doc+css   font");
  console.log("─".repeat(68));

  for (const { page, total, byType } of rows) {
    console.log(
      [
        page.padEnd(16),
        kb(total).padStart(9),
        kb(byType.Image ?? 0).padStart(9),
        kb(byType.Script ?? 0).padStart(9),
        kb((byType.Document ?? 0) + (byType.Stylesheet ?? 0)).padStart(9),
        kb(byType.Font ?? 0).padStart(6),
      ].join(" ")
    );
  }

  const heavy = rows
    .flatMap(({ page, assets }) => assets.map((a) => ({ ...a, page })))
    .filter((a) => a.bytes >= HEAVY_BYTES)
    .sort((a, b) => b.bytes - a.bytes);

  if (heavy.length) {
    console.log(`\nresponses over ${kb(HEAVY_BYTES)}`);
    for (const asset of heavy) {
      const name = decodeURIComponent(asset.url).replace(ORIGIN, "").slice(0, 92);
      console.log(`  ${kb(asset.bytes).padStart(9)}  ${asset.page.padEnd(13)} ${name}`);
    }
  } else {
    console.log(`\nno single response over ${kb(HEAVY_BYTES)}`);
  }

  console.log("");
  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
