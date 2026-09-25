/**
 * Reports every element that sticks out past the viewport at a given width,
 * which is how horizontal scrollbars sneak onto phones. Drives headless Chrome
 * over CDP so it measures real layout rather than guessing from the CSS.
 *
 *   node scripts/_find_overflow.js [url] [width] [--shot=out.png]
 *                                  [--height=N] [--at=Y]
 *
 * `--shot` writes a viewport capture at the emulated width. Prefer it over
 * `chrome --screenshot --window-size`, which lays the page out at a different
 * width than it captures and makes content look wrongly clipped.
 *
 * `--at` scrolls to that offset before capturing. Either way the page is
 * walked top to bottom first, because scroll-triggered sections start at
 * opacity 0 and would otherwise photograph blank.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const positional = args.filter((a) => !a.startsWith("--"));

const URL_ARG = positional[0] || "http://localhost:3200/";
const WIDTH = Number(positional[1] || 420);
const HEIGHT = Number(flag("height") || 900);
const AT = Number(flag("at") || 0);
const SHOT = flag("shot");
const PORT = 9333;

const CHROME_CANDIDATES = [
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Edge binary found");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** Minimal CDP client: send(method, params) -> Promise<result>. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
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
  const vw = document.documentElement.clientWidth;
  const hits = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const over = Math.round(r.right - vw);
    if (over < 2 && Math.round(r.left) > -2) continue;
    hits.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 70),
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      depth: (() => { let d = 0, n = el; while ((n = n.parentElement)) d++; return d; })(),
    });
  }
  return JSON.stringify({
    viewport: vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hits,
  });
})()`;

(async () => {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" +
        fs.mkdtempSync(require("node:path").join(require("node:os").tmpdir(), "chrome-cdp-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", (chunk) => {
    const line = chunk.toString().trim();
    if (line) process.stderr.write(`[chrome] ${line}\n`);
  });

  try {
    const client = connect(await getTargetUrl());
    await client.ready;

    const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await client.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });

    await client.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: WIDTH < 900 },
      sessionId
    );
    await client.send("Page.enable", {}, sessionId);
    await client.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(6000);

    const { result } = await client.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );
    const data = JSON.parse(result.value);

    console.log(`url        ${URL_ARG}`);
    console.log(`viewport   ${data.viewport}px`);
    console.log(`scrollWidth ${data.scrollWidth}px (body ${data.bodyScrollWidth}px)`);
    console.log(
      data.scrollWidth > data.viewport
        ? `OVERFLOW   +${data.scrollWidth - data.viewport}px\n`
        : "no horizontal overflow\n"
    );

    // Shallowest elements first: the outermost offender is usually the cause,
    // everything below it is just inheriting the stretched width.
    data.hits.sort((a, b) => a.depth - b.depth || b.width - a.width);
    for (const hit of data.hits.slice(0, 40)) {
      console.log(
        `  d${String(hit.depth).padStart(2)}  ${String(hit.width).padStart(5)}px  ` +
          `[${hit.left}..${hit.right}]  ${hit.tag}.${hit.cls}`
      );
    }
    if (data.hits.length === 0) console.log("  (nothing sticks out)");

    if (SHOT) {
      // Walk the page so every scroll-triggered section fires its reveal, then
      // return to the top. The reveals are one-shot, so they stay visible in
      // the full-page capture that follows.
      await client.send(
        "Runtime.evaluate",
        {
          expression: `(async () => {
            // The site sets scroll-behavior:smooth globally, which turns each
            // hop into an animation the loop never waits for. Force instant
            // jumps for the duration of the walk.
            const patch = document.createElement("style");
            patch.textContent = "*{scroll-behavior:auto !important}";
            document.head.append(patch);

            const step = window.innerHeight * 0.8;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 140));
            }
            window.scrollTo(0, ${AT});
            patch.remove();
            await new Promise((r) => setTimeout(r, 1200));
          })()`,
          awaitPromise: true,
        },
        sessionId
      );

      // Viewport-sized only: full-page capture of a tall marketing page ties
      // up the compositor for minutes at desktop widths.
      const shot = await client.send(
        "Page.captureScreenshot",
        { format: "png" },
        sessionId
      );
      fs.writeFileSync(SHOT, Buffer.from(shot.data, "base64"));
      console.log(`\nwrote ${SHOT}`);
    }

    client.close();
  } finally {
    chrome.kill();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
