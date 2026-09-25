/**
 * Screenshots the campaigns admin: table, add dialog, edit dialog, delete
 * confirmation.
 *
 *   node scripts/_campaigns_shots.js [url] [--out=tmp/campaigns]
 *
 * Read-only — it opens the dialogs but never saves or deletes.
 */
const fs = require("node:fs");
const path = require("node:path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300";
const OUT = (args.find((a) => a.startsWith("--out=")) || "--out=tmp/campaigns").slice(6);

function readEnv() {
  const out = {};
  for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

(async () => {
  const env = readEnv();
  fs.mkdirSync(OUT, { recursive: true });

  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const evaluate = async (expression, awaitPromise = false) => {
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise },
        sessionId
      );
      return result.value;
    };

    const shoot = async (name) => {
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      const file = path.join(OUT, `${name}.png`);
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      console.log(`   wrote ${file}`);
    };

    await cdp.send("Page.navigate", { url: `${BASE}/admin/login` }, sessionId);
    await sleep(2500);
    await evaluate(
      `fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(${JSON.stringify(
        { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }
      )})}).then(async r=>{const b=await r.json();sessionStorage.setItem("balitech_admin_jwt",b.token);return 1;})`,
      true
    );

    await cdp.send("Page.navigate", { url: `${BASE}/admin/campaigns` }, sessionId);
    for (let i = 0; i < 60; i++) {
      if (await evaluate(`document.querySelectorAll("table tbody tr").length > 0`)) break;
      await sleep(250);
    }
    await sleep(600);
    await shoot("1-table");

    const click = (finder) =>
      evaluate(`(() => { const el = ${finder}; el.focus(); el.click(); })()`);

    await click(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Add Campaign"))`);
    await sleep(700);
    await shoot("2-add-dialog");
    await evaluate(`document.querySelector('.admin-modal__close').click()`);
    await sleep(500);

    /* Final Expense by name rather than by row index: it is the campaign that
       runs at more than one branch, so it is the one worth seeing. */
    await click(
      `document.querySelector('button[aria-label="Edit Final Expense"]') ?? document.querySelectorAll('button[aria-label^="Edit"]')[2]`
    );
    await sleep(700);
    await shoot("3-edit-dialog");
    await evaluate(`document.querySelector('.admin-modal__close').click()`);
    await sleep(500);

    await click(`document.querySelectorAll('button[aria-label^="Delete"]')[2]`);
    await sleep(700);
    await shoot("4-delete-confirm");
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
