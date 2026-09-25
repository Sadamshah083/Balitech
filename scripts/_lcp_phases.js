/**
 * Which phase of the largest contentful paint the time is actually spent in.
 *
 *   node scripts/_lcp_phases.js [url]
 *
 * The scored LCP sits ~2s behind the scored FCP even though the browser records
 * both at the same millisecond for the same element. That only makes sense if
 * the simulator thinks the paint waits on something the first paint does not,
 * and the phase breakdown is where Lighthouse says which.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const url = process.argv[2] || "http://127.0.0.1:3300/";
const out = path.join(os.tmpdir(), `lcp-phases-${process.pid}.json`);

const args = [
  "lighthouse",
  url,
  "--only-categories=performance",
  "--output=json",
  `--output-path=${out}`,
  "--quiet",
  "--chrome-flags=--headless=new --no-sandbox --disable-extensions",
];

const child = spawn("npx", args, { shell: true, stdio: "ignore" });

child.on("exit", () => {
  const lhr = JSON.parse(fs.readFileSync(out, "utf8"));
  fs.rmSync(out, { force: true });

  const audits = lhr.audits;
  const num = (id) => audits[id]?.numericValue;

  console.log(`\n${url}\n`);
  console.log("scored metrics");
  for (const id of [
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "total-blocking-time",
  ]) {
    const a = audits[id];
    if (a) {
      console.log(
        `   ${id.padEnd(28)} ${String(Math.round(a.numericValue)).padStart(5)} ms  score ${Math.round((a.score ?? 0) * 100)}`
      );
    }
  }

  const el = audits["largest-contentful-paint-element"];
  console.log(`\nLCP element audit: ${el?.displayValue ?? "(no displayValue)"}`);

  /* The element audit carries the phase table as a nested sub-table, and the
     insight audit carries the same numbers in newer Lighthouse. Print whichever
     one this version actually populated. */
  const tables = [];
  const collect = (node, depth = 0) => {
    if (!node || depth > 4) return;
    if (node.type === "table" && Array.isArray(node.items)) tables.push(node);
    for (const item of node.items ?? []) {
      if (item && typeof item === "object") collect(item, depth + 1);
    }
  };
  collect(el?.details);
  collect(audits["lcp-breakdown-insight"]?.details);
  collect(audits["lcp-lazy-loaded"]?.details);

  for (const table of tables) {
    for (const row of table.items) {
      const label = row.phase ?? row.label ?? row.node?.snippet ?? row.subpart;
      const value =
        row.timing ?? row.duration ?? row.percent ?? row.value ?? row.total;
      if (label && value !== undefined) {
        const shown =
          typeof value === "number" ? `${Math.round(value)} ms` : String(value);
        console.log(`   ${String(label).slice(0, 46).padEnd(48)} ${shown}`);
      }
    }
  }

  const blocking = audits["render-blocking-resources"];
  if (blocking?.details?.items?.length) {
    console.log(`\nrender-blocking (${blocking.displayValue ?? ""})`);
    for (const item of blocking.details.items) {
      console.log(
        `   ${String(Math.round(item.wastedMs)).padStart(5)} ms  ${Math.round((item.totalBytes ?? 0) / 1024)} KiB  ${String(item.url).slice(-58)}`
      );
    }
  }

  const chains = audits["critical-request-chains"];
  if (chains?.displayValue) console.log(`\ncritical chains: ${chains.displayValue}`);

  console.log(`\nobserved (unsimulated): LCP ${num("largest-contentful-paint")} ms\n`);
});
