/**
 * How much of the stylesheet a page actually uses.
 *
 *   node scripts/_css_coverage.js [url] [--w=412] [--h=915]
 *
 * The whole site's CSS ships as one render-blocking file, and Lighthouse
 * attributes 618ms of the home page's largest-contentful-paint delay to waiting
 * for it. This reports the used fraction per page, which is what decides whether
 * splitting it per route is worth doing.
 *
 * Rules are counted after a full scroll, so sections that are only styled once
 * revealed are not miscounted as dead.
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

const URLS = args.filter((a) => !a.startsWith("--"));
if (!URLS.length) URLS.push("http://127.0.0.1:3300/");
const WIDTH = Number(flag("w", 412));
const HEIGHT = Number(flag("h", 915));
const PORT = Number(flag("port", 9500 + (process.pid % 300)));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Edge binary found");
  return found;
}

async function browserWs() {
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
  const sheets = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "CSS.styleSheetAdded") {
      const h = msg.params.header;
      sheets.set(h.styleSheetId, h);
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    sheets,
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

async function measure(cdp, url) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: WIDTH < 700 },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("DOM.enable", {}, sessionId);
  await cdp.send("CSS.enable", {}, sessionId);
  await cdp.send("CSS.startRuleUsageTracking", {}, sessionId);

  await cdp.send("Page.navigate", { url }, sessionId);
  await sleep(8000);

  /* Scrolled to the bottom first: sections revealed on scroll only match their
     rules once they are rendered, and `content-visibility` defers some of that
     work until then too. Without this pass they would look unused. */
  await cdp.send(
    "Runtime.evaluate",
    {
      expression: `(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
        }
        window.scrollTo(0, 0);
      })()`,
      awaitPromise: true,
    },
    sessionId
  );
  await sleep(1500);

  const { ruleUsage } = await cdp.send("CSS.stopRuleUsageTracking", {}, sessionId);

  /* The same rule is reported once per scroll step it was evaluated in, so the
     ranges have to be collapsed by position before they are summed — otherwise
     a 244 KB sheet totals several megabytes and everything looks used. */
  const seen = new Map();
  for (const rule of ruleUsage) {
    const key = `${rule.styleSheetId}:${rule.startOffset}`;
    const previous = seen.get(key);
    if (previous) {
      previous.used = previous.used || rule.used;
      continue;
    }
    seen.set(key, { ...rule });
  }

  const perSheet = new Map();
  for (const rule of seen.values()) {
    const bucket = perSheet.get(rule.styleSheetId) ?? { used: 0, total: 0, rules: 0, usedRules: 0 };
    const bytes = rule.endOffset - rule.startOffset;
    bucket.total += bytes;
    bucket.rules += 1;
    if (rule.used) {
      bucket.used += bytes;
      bucket.usedRules += 1;
    }
    perSheet.set(rule.styleSheetId, bucket);
  }

  await cdp.send("Target.closeTarget", { targetId });
  return perSheet;
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
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-css-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await browserWs());
  await cdp.ready;

  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

  for (const url of URLS) {
    const perSheet = await measure(cdp, url);
    console.log(`\n${url}  @ ${WIDTH}x${HEIGHT}`);
    console.log("      total      used   unused   used%      rules used  stylesheet");

    let allTotal = 0;
    let allUsed = 0;
    for (const [id, bucket] of perSheet) {
      const header = cdp.sheets.get(id);
      const name = (header?.sourceURL || "(inline)").split("/").pop();
      allTotal += bucket.total;
      allUsed += bucket.used;
      const pct = bucket.total ? ((bucket.used / bucket.total) * 100).toFixed(0) : "0";
      console.log(
        `   ${kb(bucket.total).padStart(8)}  ${kb(bucket.used).padStart(8)}  ` +
          `${kb(bucket.total - bucket.used).padStart(7)}  ${pct.padStart(5)}%  ` +
          `${String(bucket.rules).padStart(10)} ${String(bucket.usedRules).padStart(4)}  ${name}`
      );
    }
    const pct = allTotal ? ((allUsed / allTotal) * 100).toFixed(0) : "0";
    console.log(
      `   ${kb(allTotal).padStart(8)}  ${kb(allUsed).padStart(8)}  ` +
        `${kb(allTotal - allUsed).padStart(7)}  ${pct.padStart(5)}%  TOTAL`
    );
  }

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
