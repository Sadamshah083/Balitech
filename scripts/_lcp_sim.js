/**
 * Why Lighthouse's *simulated* LCP differs from the paint the browser reports.
 *
 *   node scripts/_lcp_sim.js [url]
 *
 * The browser puts this page's LCP at 1304 ms (`_lcp_node.js`); Lighthouse
 * scores it at 4.25 s. Only one of those is worth optimising for, and finding
 * out which needs the simulator's own inputs: the observed values it started
 * from, its optimistic and pessimistic estimates, and the requests it believes
 * the paint is waiting on.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const URL_ARG = process.argv[2] || "http://127.0.0.1:3300/";
const out = path.join(os.tmpdir(), `lh-sim-${process.pid}.json`);

spawnSync(
  "npx",
  [
    "--yes",
    "lighthouse",
    URL_ARG,
    "--output=json",
    `--output-path=${out}`,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-extensions",
    "--only-categories=performance",
  ],
  { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 }
);

if (!fs.existsSync(out)) {
  console.error("lighthouse produced no report");
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(out, "utf8"));
fs.unlinkSync(out);

const ms = (n) => (n == null ? "  -  " : `${Math.round(n)} ms`);
const m = r.audits.metrics?.details?.items?.[0] ?? {};

console.log("\nobserved (from Lighthouse's own throttled trace)");
console.log(`   FCP  ${ms(m.observedFirstContentfulPaint)}   LCP  ${ms(m.observedLargestContentfulPaint)}   SI  ${ms(m.observedSpeedIndex)}`);
console.log(`   DCL  ${ms(m.observedDomContentLoaded)}   load ${ms(m.observedLoad)}   trace end ${ms(m.observedTraceEnd)}`);

console.log("\nsimulated (what the score uses)");
console.log(`   FCP  ${ms(m.firstContentfulPaint)}   LCP  ${ms(m.largestContentfulPaint)}   SI  ${ms(m.speedIndex)}   TBT ${ms(m.totalBlockingTime)}`);

const lcpAudit = r.audits["largest-contentful-paint"];
if (lcpAudit?.details?.items) {
  console.log("\nsimulator estimates");
  for (const item of lcpAudit.details.items) {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === "number") console.log(`   ${k.padEnd(28)} ${ms(v)}`);
    }
  }
}

const el = r.audits["largest-contentful-paint-element"];
console.log(`\nLCP element audit: ${el?.displayValue ?? "(no value)"}`);
const walk = (items, depth = 0) => {
  for (const item of items ?? []) {
    const pad = "   ".repeat(depth + 1);
    if (item.node) console.log(`${pad}node  ${(item.node.selector || item.node.snippet || "").slice(0, 90)}`);
    if (item.phase) console.log(`${pad}${String(item.phase).padEnd(22)} ${ms(item.timing)}`);
    walk(item.items ?? item.subItems?.items, depth + 1);
  }
};
walk(el?.details?.items);

/* The requests Lantern thinks stand between the document and the paint. Long
   poles here are the only thing that can move the simulated number. */
const chain = r.audits["network-dependency-tree-insight"] ?? r.audits["critical-request-chains"];
console.log(`\ncritical path (${chain?.id ?? "n/a"})`);
const chainWalk = (nodes, depth = 0) => {
  for (const n of nodes ?? []) {
    const pad = "   ".repeat(depth + 1);
    const url = (n.url || n.request?.url || "").replace(URL_ARG, "/");
    if (url) {
      const t = n.navStartToEndTime ?? n.request?.endTime;
      console.log(`${pad}${url.split("/").pop().slice(0, 60).padEnd(62)} ${ms(t)}`);
    }
    chainWalk(n.children ?? n.chains, depth + 1);
  }
};
chainWalk(chain?.details?.chains ?? chain?.details?.items);

console.log("\nlongest tasks before the paint");
for (const t of (r.audits["long-tasks"]?.details?.items ?? []).slice(0, 8)) {
  console.log(`   ${ms(t.duration).padStart(8)}  start ${ms(t.startTime).padStart(8)}  ${String(t.url || "").split("/").pop().slice(0, 54)}`);
}
