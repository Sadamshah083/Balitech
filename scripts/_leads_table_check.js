/**
 * Measures the leads table the way a person reads it.
 *
 *   node scripts/_leads_table_check.js [url] [--width=1440]
 *
 * The fault it exists to catch: applicants paste a full postal address into the
 * Company field, and with an auto-layout table one 90-character value wraps to
 * eleven lines and drags the whole row to ~230px, so three leads fill the
 * screen. Row height is therefore the thing to assert on, and it has to be
 * measured on real rows — the tallest value in the current page of results is
 * what sets it, and that is invisible from the markup.
 *
 * Clipping is the other half. Fixed columns keep the rows level only by cutting
 * text off, which is fine for an address and not fine for a phone number, so
 * every cell is checked for overflow and the ones that must stay readable are
 * reported separately from the ones that may be trimmed.
 */
const fs = require("node:fs");
const path = require("node:path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3210";
const hit = args.find((a) => a.startsWith("--width="));
const WIDTH = hit ? Number(hit.slice(8)) : 1440;
/* The local database holds two tidy leads, so it cannot reproduce the fault.
   Every row is measured, then the offending value — the address applicants
   paste into Company — is written into the rendered cells and they are measured
   again. Whether the height moved is the whole question, and asking it this way
   needs no particular data and no fixed pixel budget to compare against. */
const LONG =
  "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400";

/* Columns whose value is useless when trimmed: you cannot ring half a phone
   number. The rest may ellipsis — the full text is on the lead's own page. */
const MUST_READ = ["Phone", "Status", "Date"];

function readEnv() {
  const file = path.join(__dirname, "..", ".env");
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`   ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `   ${detail}` : ""}`);
};

(async () => {
  const env = readEnv();
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD missing from .env");
  }

  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const evaluate = async (expression, awaitPromise = false) => {
      const { result, exceptionDetails } = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise },
        sessionId
      );
      if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description || "eval failed");
      }
      return result.value;
    };

    const waitFor = async (expression, label, timeout = 90000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await evaluate(`Boolean(${expression})`)) return true;
        await sleep(250);
      }
      /* A bare timeout says nothing useful when a dev build is still compiling,
         the page bounced to the login screen, or the filter matched nothing. */
      const state = await evaluate(`JSON.stringify({
        url: location.pathname,
        rows: document.querySelectorAll("table tbody tr").length,
        text: document.body.innerText.slice(0, 400),
      })`);
      throw new Error(`timed out waiting for ${label}\n   page state: ${state}`);
    };

    console.log(`\n${BASE}/admin/leads   at ${WIDTH}px\n`);

    await cdp.send("Page.navigate", { url: `${BASE}/admin/login` }, sessionId);
    await sleep(2500);

    const login = await evaluate(
      `fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ${JSON.stringify(env.ADMIN_EMAIL)},
          password: ${JSON.stringify(env.ADMIN_PASSWORD)},
        }),
      }).then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.token) sessionStorage.setItem("balitech_admin_jwt", body.token);
        return { ok: r.ok, status: r.status };
      })`,
      true
    );
    check("signed in as admin", login.ok, `HTTP ${login.status}`);
    if (!login.ok) throw new Error("cannot continue without a session");

    await cdp.send("Page.navigate", { url: `${BASE}/admin/leads` }, sessionId);
    await waitFor(`document.querySelectorAll("table tbody tr").length > 0`, "leads table");
    await sleep(1200);

    const MEASURE = `
      JSON.stringify((() => {
        const table = document.querySelector("table");
        const scroller = table.parentElement;
        const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll("tbody tr"));

        const heights = rows.map((r) => Math.round(r.getBoundingClientRect().height));
        const clipped = [];
        for (const r of rows) {
          Array.from(r.children).forEach((td, i) => {
            /* A select reports its own overflow oddly, so measure the control. */
            const el = td.querySelector("select") || td;
            if (el.scrollWidth > el.clientWidth + 1) {
              clipped.push({
                col: heads[i] || String(i),
                text: td.textContent.trim().slice(0, 40),
                /* So a column that must not clip can be widened by exactly the
                   amount it is short, rather than by guesswork. */
                need: el.scrollWidth,
                have: el.clientWidth,
              });
            }
          });
        }

        const byCol = {};
        for (const c of clipped) byCol[c.col] = (byCol[c.col] || 0) + 1;

        return {
          rows: rows.length,
          heights,
          min: Math.min(...heights),
          max: Math.max(...heights),
          tableWidth: Math.round(table.getBoundingClientRect().width),
          scrollerWidth: Math.round(scroller.clientWidth),
          overflowX: table.scrollWidth > scroller.clientWidth + 1,
          byCol,
          samples: clipped.slice(0, 4),
          shortfall: clipped
            .filter((c) => ${JSON.stringify(MUST_READ)}.includes(c.col))
            .map((c) => ({ col: c.col, text: c.text, short: c.need - c.have })),
          widths: heads.map((h, i) => ({
            col: h,
            px: Math.round(table.querySelectorAll("thead th")[i].getBoundingClientRect().width),
          })),
        };
      })())
    `;

    const before = JSON.parse(await evaluate(MEASURE));

    const stressed = await evaluate(`
      (() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));
        for (const r of rows) {
          if (r.children[3]) r.children[3].textContent = ${JSON.stringify(LONG)};
          if (r.children[5]) r.children[5].textContent = ${JSON.stringify(LONG)};
        }
        return rows.length;
      })()
    `);
    await sleep(600);
    const r = JSON.parse(await evaluate(MEASURE));

    console.log(
      `\n   ${r.rows} rows at ${before.min}–${before.max}px, then ${stressed} rows given a ` +
        `${LONG.length}-character address in Company and Message\n`
    );
    console.log(`   column        width   clipped cells`);
    console.log(`   ────────────────────────────────────`);
    for (const w of r.widths) {
      const n = r.byCol[w.col] || 0;
      console.log(
        `   ${w.col.padEnd(13)}${String(w.px).padStart(4)}px   ${
          n ? `${n}${MUST_READ.includes(w.col) ? "  <-- must stay readable" : ""}` : "-"
        }`
      );
    }

    console.log("");
    check("rows are a uniform height", r.max - r.min <= 2, `${r.min}–${r.max}px`);
    check(
      "a long address does not grow the row",
      r.max <= before.max + 2,
      `${before.max}px before, ${r.max}px after`
    );
    const unreadable = MUST_READ.filter((c) => r.byCol[c]);
    check(
      "nothing clipped that must be read in full",
      unreadable.length === 0,
      unreadable.length ? unreadable.join(", ") : `${MUST_READ.join(", ")} all fit`
    );
    for (const s of r.shortfall) {
      console.log(`         ${s.col} needs ${s.short}px more for "${s.text}"`);
    }
    /* Nine columns do not fit a narrow window at a readable size, and the table
       has always scrolled sideways below its floor. What matters is that the
       columns stay within that floor rather than pushing past it, which is what
       an over-wide cell would do. */
    check(
      "columns stay within the table's minimum width",
      r.tableWidth <= Math.max(r.scrollerWidth, 1040) + 2,
      `table ${r.tableWidth}px, floor 1040px`
    );
    if (r.overflowX) {
      console.log(
        `   note  scrolls sideways at this width: ${r.tableWidth}px table in a ${r.scrollerWidth}px panel`
      );
    }

    if (r.samples.length) {
      console.log(`\n   trimmed with an ellipsis (full text on the lead's page):`);
      for (const s of r.samples) console.log(`     ${s.col.padEnd(12)} ${s.text}`);
    }

    const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    fs.mkdirSync("tmp", { recursive: true });
    fs.writeFileSync(`tmp/leads_${WIDTH}.png`, Buffer.from(png.data, "base64"));
    console.log(`\n   ${failures ? failures + " failing" : "all good"} — shot in tmp/leads_${WIDTH}.png\n`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
