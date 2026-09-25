/**
 * A/B the rendering cost of a page against the same page with one layer removed.
 *
 *   node scripts/_raster_ab.js [url] [--kill=.light-path] [--cpu=4]
 *
 * Sums the compositor's own trace events — raster, paint, layerise, style and
 * layout — over a scripted scroll. Lighthouse bills all of this to the document
 * task, where it cannot be told apart from HTML parsing, so this is the only way
 * to attribute it to a specific layer and to know whether removing that layer is
 * worth a redesign.
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
const KILL = flag("kill", ".light-path");
const CPU = Number(flag("cpu", 4));
/* Tracing is per-browser, so a run that leaves Chrome behind blocks the next
   one on a fixed port with "Tracing has already been started". */
const PORT = Number(flag("port", 9340 + (process.pid % 400)));

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
  const events = [];
  let onComplete = null;
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Tracing.dataCollected") events.push(...msg.params.value);
    if (msg.method === "Tracing.tracingComplete" && onComplete) {
      onComplete();
      onComplete = null;
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    events,
    close: () => ws.close(),
    /* Tracing is browser-wide, so the next run cannot start until this one has
       actually flushed. Sleeping instead of waiting for the event left tracing
       open on a loaded machine and failed the following measurement. */
    stopTracing() {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("trace never completed")), 30000);
        onComplete = () => {
          clearTimeout(timer);
          resolve();
        };
        this.send("Tracing.end").catch(reject);
      });
    },
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
  };
}

/* Categories the compositor and main thread report separately, so a regression
   can be pinned to rasterisation rather than to layout or style. */
const BUCKETS = {
  raster: ["RasterTask", "Rasterize"],
  paint: ["Paint", "PaintImage", "UpdateLayer"],
  layerise: ["UpdateLayerTree", "CompositeLayers", "Commit"],
  style: ["UpdateLayoutTree", "RecalculateStyles", "ParseAuthorStyleSheet"],
  layout: ["Layout", "LayoutShift"],
  script: ["EvaluateScript", "FunctionCall", "v8.compile", "V8.Execute"],
  decode: ["Decode Image", "ImageDecodeTask", "Decode LazyPixelRef"],
};

function summarise(events) {
  const totals = Object.fromEntries(Object.keys(BUCKETS).map((k) => [k, 0]));
  let counted = 0;

  for (const e of events) {
    if (e.ph !== "X" || typeof e.dur !== "number") continue;
    for (const [bucket, names] of Object.entries(BUCKETS)) {
      if (names.includes(e.name)) {
        totals[bucket] += e.dur / 1000;
        counted += 1;
        break;
      }
    }
  }

  return { totals, counted };
}

async function measure(cdp, { kill }) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 412, height: 915, deviceScaleFactor: 2, mobile: true },
    sessionId
  );
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
  await cdp.send("Page.enable", {}, sessionId);

  if (kill) {
    // Removed before the document has a chance to lay out, so the run never
    // pays the cost even once.
    await cdp.send(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source: `new MutationObserver(() => {
          document.querySelectorAll(${JSON.stringify(kill)}).forEach((n) => n.remove());
        }).observe(document.documentElement, { childList: true, subtree: true });`,
      },
      sessionId
    );
  }

  cdp.events.length = 0;
  await cdp.send("Tracing.start", {
    categories: "disabled-by-default-devtools.timeline,devtools.timeline",
    transferMode: "ReportEvents",
  });

  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(9000);

  /* Scrolled so the run covers the ribbon being extended and every section
     being revealed, not just the first screen. */
  await cdp.send(
    "Runtime.evaluate",
    {
      expression: `(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        for (let y = 0; y < document.body.scrollHeight; y += 900) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
        }
      })()`,
      awaitPromise: true,
    },
    sessionId
  );
  await sleep(1200);

  await cdp.stopTracing();

  const result = summarise(cdp.events);
  await cdp.send("Target.closeTarget", { targetId });
  return result;
}

(async () => {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-ab-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await browserWs());
  await cdp.ready;

  /* Several selectors in one browser session, so the variants are compared
     under the same machine load rather than across minutes of drift. */
  const variants = [null, ...KILL.split("|").filter(Boolean)];
  const runs = [];

  for (const kill of variants) {
    process.stdout.write(`measuring ${kill ? `without ${kill}` : "as-is"} ... `);
    const run = await measure(cdp, { kill });
    console.log(`${run.counted} events`);
    runs.push({ label: kill ? kill.replace(/^\./, "") : "as-is", ...run });
  }

  const base = runs[0];
  console.log(`\nmain-thread + compositor time, ${CPU}x CPU throttle\n`);

  const width = Math.max(12, ...runs.map((r) => r.label.length + 1));
  console.log("   bucket     " + runs.map((r) => r.label.padStart(width)).join(""));

  const keys = [...Object.keys(BUCKETS), "TOTAL"];
  const totalOf = (run) => Object.values(run.totals).reduce((a, b) => a + b, 0);

  for (const key of keys) {
    const cells = runs.map((run, i) => {
      const value = key === "TOTAL" ? totalOf(run) : run.totals[key];
      if (i === 0) return `${value.toFixed(0)} ms`.padStart(width);
      const delta = value - (key === "TOTAL" ? totalOf(base) : base.totals[key]);
      const sign = delta > 0 ? "+" : "";
      return `${value.toFixed(0)} (${sign}${delta.toFixed(0)})`.padStart(width);
    });
    console.log(`   ${key.padEnd(11)}${cells.join("")}`);
  }

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
