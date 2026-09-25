/**
 * Photographs a page at fixed delays after navigation, without scrolling.
 *
 *   node scripts/_shoot_early.js [url] [--w=1440] [--h=950] [--at=800,1600] [--out=dir]
 *
 * The other capture scripts walk the page to trigger scroll reveals, which is
 * useless for the intro loader: it lives for a couple of seconds and is gone
 * before any of that finishes. Here `--at` is milliseconds since navigation.
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

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3200/";
const WIDTH = Number(flag("w", 1440));
const HEIGHT = Number(flag("h", 950));
const OUT = flag("out", "tmp/early");
const DELAYS = flag("at", "1200")
  .split(",")
  .map((n) => Number(n.trim()))
  .sort((a, b) => a - b);
const PORT = 9338;

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
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-early-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  /* The loader's progress runs off requestAnimationFrame, which Chrome throttles
     to a standstill in a backgrounded tab — without this the intro sits at 000%
     in every frame. */
  await cdp.send("Target.activateTarget", { targetId });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 700 },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);

  /* Warm the cache first. On a cold dev server the first paint arrives well
     after the loader would have finished, so every frame would be blank. */
  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(9000);

  fs.mkdirSync(OUT, { recursive: true });

  /* A cache-busted query replays the intro on a fresh document. `Page.reload`
     restores so fast from the warm cache that the loader is already gone by the
     first frame, and navigating via about:blank drops the CDP session. */
  const bust = URL_ARG + (URL_ARG.includes("?") ? "&" : "?") + "replay=" + Date.now();
  const started = Date.now();
  await cdp.send("Page.navigate", { url: bust }, sessionId);

  for (const at of DELAYS) {
    const wait = at - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    const file = path.join(OUT, `t${at}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`wrote ${file}`);
  }

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
