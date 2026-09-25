/**
 * Photographs an element in its resting and hovered states, side by side.
 *
 *   node scripts/_shoot_hover.js [url] [selector] [--out=dir] [--pad=N]
 *
 * Hover states are the one thing a normal screenshot cannot show, and the
 * two-edge card glow is easy to get subtly wrong — a shadow on the wrong pair
 * of sides, or one that shifts the layout by a pixel. Writing both frames from
 * the same clip makes the difference obvious and any movement visible.
 *
 * The hover is driven through Input.dispatchMouseEvent rather than a forced
 * `:hover` style, so it exercises the same code path a real pointer does.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const positional = args.filter((a) => !a.startsWith("--"));

const URL_ARG = positional[0] || "http://localhost:3200/";
const SELECTOR = positional[1] || ".ent-card";
const OUT = flag("out") || "tmp";
const PAD = Number(flag("pad") || 40);
const WIDTH = 1440;
const HEIGHT = 950;
const PORT = 9335;

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
      "--force-device-scale-factor=1",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "chrome-hover-")),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

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
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(6000);

  /* Scroll-triggered sections start at opacity 0, so the page has to be walked
     before the target is even rendered. */
  await evaluate(`(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  })()`);

  const found = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(SELECTOR)});
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);

  if (!found) throw new Error(`No element matched ${SELECTOR}`);

  /* The rect has to be read after the scroll settles, not with it. The site
     sets `scroll-behavior: smooth` globally, so a rect taken in the same turn
     as scrollIntoView describes where the element used to be — and the hover
     would then be dispatched at empty space. */
  await sleep(900);
  const box = await evaluate(`(() => {
    const r = document.querySelector(${JSON.stringify(SELECTOR)}).getBoundingClientRect();
    return {
      x: r.left,
      y: r.top,
      width: r.width,
      height: r.height,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  })()`);

  /* A capture clip is in document coordinates, not viewport ones — passing the
     bounding rect straight through photographs whatever happens to be that far
     down the page from the top. */
  const clip = {
    x: Math.max(0, Math.round(box.x + box.scrollX - PAD)),
    y: Math.max(0, Math.round(box.y + box.scrollY - PAD)),
    width: Math.round(box.width + PAD * 2),
    height: Math.round(box.height + PAD * 2),
    scale: 1,
  };

  fs.mkdirSync(OUT, { recursive: true });

  const shoot = async (name) => {
    const shot = await cdp.send(
      "Page.captureScreenshot",
      { format: "png", clip, captureBeyondViewport: false },
      sessionId
    );
    const file = path.join(OUT, name);
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`wrote ${file}`);
  };

  await shoot("hover-rest.png");

  /* Move onto the middle of the element and let the transition settle. */
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseMoved",
      x: Math.round(box.x + box.width / 2),
      y: Math.round(box.y + box.height / 2),
      buttons: 0,
    },
    sessionId
  );
  await sleep(900);

  const hovered = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(SELECTOR)});
    return {
      matchesHover: el.matches(":hover"),
      boxShadow: getComputedStyle(el).boxShadow.slice(0, 200),
    };
  })()`);

  console.log(`:hover active   ${hovered.matchesHover}`);
  console.log(`box-shadow      ${hovered.boxShadow}`);

  await shoot("hover-active.png");

  cdp.close();
  chrome.kill();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
