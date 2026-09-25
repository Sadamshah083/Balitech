/**
 * Measures the area the page asks the compositor to rasterise.
 *
 *   node scripts/_paint_cost.js [url] [--w=412] [--h=915]
 *
 * The ribbon is one full-document-height SVG carrying large blur filters, so
 * its cost scales with page height, not viewport height. Lighthouse bills that
 * to the document task, where it is indistinguishable from HTML parsing — this
 * separates the two.
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
const WIDTH = Number(flag("w", 412));
const HEIGHT = Number(flag("h", 915));
const PORT = 9337;

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

const PROBE = `(() => {
  const doc = document.documentElement;
  const svg = document.querySelector(".light-path__svg");
  const strands = [...document.querySelectorAll(".light-path__strand")];
  const all = [...document.querySelectorAll("*")];
  const styled = all.map((el) => ({ el, s: getComputedStyle(el) }));
  const mp = (w, h) => +((w * h) / 1e6).toFixed(1);

  const radii = strands
    .map((p) => getComputedStyle(p).filter)
    .filter((f) => f && f !== "none");

  return {
    viewport: [innerWidth, innerHeight],
    documentPx: [doc.scrollWidth, doc.scrollHeight],
    documentMegapixels: mp(doc.scrollWidth, doc.scrollHeight),
    ribbonPx: svg ? [svg.clientWidth, svg.clientHeight] : null,
    ribbonMegapixels: svg ? mp(svg.clientWidth, svg.clientHeight) : 0,
    blurredStrands: strands.length,
    blurRadii: [...new Set(radii)],
    backdropFilter: styled.filter((x) => x.s.backdropFilter !== "none").length,
    blendMode: styled.filter((x) => x.s.mixBlendMode !== "normal").length,
    willChange: styled.filter((x) => x.s.willChange !== "auto").length,
    contentVisibility: styled.filter((x) => x.s.contentVisibility !== "visible").length,
    domNodes: all.length,
  };
})()`;

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
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-paint-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: WIDTH < 700 },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(9000);

  const { result, exceptionDetails } = await cdp.send(
    "Runtime.evaluate",
    { expression: PROBE, returnByValue: true },
    sessionId
  );
  if (exceptionDetails) throw new Error(exceptionDetails.text);

  console.log(JSON.stringify(result.value, null, 2));

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
