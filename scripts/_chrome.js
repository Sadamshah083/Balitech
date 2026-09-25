/**
 * Shared headless-Chrome plumbing for the audit scripts.
 *
 * Exists because `child.kill()` only ends Chrome's browser process; its
 * renderer, GPU and utility children keep running. Repeated audit runs left 59
 * orphaned processes and 318 temp profiles behind, which quietly stole the CPU
 * the next run was trying to measure — a Lighthouse pass on an unchanged build
 * scored 81 clean and 67 with the leftovers around. `stop()` below kills the
 * whole tree and removes the profile directory.
 */
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const CANDIDATES = [
  process.env.CHROME_PATH,
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Edge binary found (set CHROME_PATH)");
  return found;
}

/** A debugging port unlikely to collide with a concurrent run. */
function pickPort(base = 9400) {
  return base + (process.pid % 400);
}

/**
 * Launches headless Chrome and resolves once its debugging port answers.
 * Returns the websocket URL plus a `stop()` that leaves nothing behind.
 */
async function launch({ port = pickPort(), flags = [] } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-audit-"));

  const child = spawn(
    findChrome(),
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--disable-extensions",
      "--disable-background-networking",
      "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      ...flags,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  child.stderr.on("data", () => {});

  let wsUrl = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!wsUrl) {
    stop(child, profile);
    throw new Error("Chrome did not expose its debugging port");
  }

  return { wsUrl, port, stop: () => stop(child, profile) };
}

function stop(child, profile) {
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
  } catch {
    // Already gone.
  }

  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    // Windows can hold the lock briefly; the OS will clear it.
  }
}

/** Minimal CDP client over the browser websocket. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    close: () => ws.close(),
    on(method, fn) {
      const list = listeners.get(method) ?? [];
      list.push(fn);
      listeners.set(method, list);
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

module.exports = { findChrome, launch, connect, pickPort, sleep };
