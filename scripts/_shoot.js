/**
 * Photographs the viewport at a series of scroll offsets.
 *
 *   node scripts/_shoot.js [url] [--w=1440] [--h=950] [--at=0,900,1800] [--out=dir]
 *   node scripts/_shoot.js [url] [--sel=.framework]   # offset resolved from a selector
 *
 * Full-page captures are useless for judging this design: the ribbon and the
 * card glows are scroll-linked, so what matters is what a viewport-sized window
 * looks like at a given offset, not the page flattened into one tall image.
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
const OUT = flag("out", "tmp/shots");
const SELECTOR = flag("sel", null);
const OFFSETS = flag("at", "0")
  .split(",")
  .map((n) => Number(n.trim()));
const PORT = 9336;

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
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-shoot-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  };

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 700 },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(7000);

  /* Reveal animations only fire once their trigger has been crossed, so the
     page is walked to the bottom before anything is photographed. `smooth`
     scrolling is disabled first, otherwise every jump below lands late. */
  await evaluate(`(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  })()`);

  fs.mkdirSync(OUT, { recursive: true });

  /* A selector is easier to aim than a pixel offset when a section's position
     shifts as the layout changes. Backed off by a little so the section's top
     edge isn't hidden under the sticky header. */
  const offsets = SELECTOR
    ? [
        await evaluate(`(() => {
          const el = document.querySelector(${JSON.stringify(SELECTOR)});
          if (!el) throw new Error("no match for ${SELECTOR}");
          return Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90);
        })()`),
      ]
    : OFFSETS;

  for (const y of offsets) {
    await evaluate(`window.scrollTo(0, ${y})`);
    await sleep(1200);
    const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    const file = path.join(OUT, `y${y}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`wrote ${file}`);
  }

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
