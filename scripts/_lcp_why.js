/**
 * Dumps everything Lighthouse knows about this page's largest contentful paint.
 *
 *   node scripts/_lcp_why.js [url]
 *
 * The observed trace has FCP and LCP landing on the same paint, yet the score
 * is calculated from a simulated LCP seconds later. This prints the audits that
 * explain the gap — the element, the phase breakdown, and the critical chain
 * Lantern believes the paint is waiting on.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const URL_ARG = process.argv[2] || "http://127.0.0.1:3300/";
const out = path.join(os.tmpdir(), `lh-why-${process.pid}.json`);

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

const ms = (n) => `${Math.round(n)} ms`;

console.log(`\nsimulated  FCP ${ms(r.audits["first-contentful-paint"].numericValue)}` +
  `   LCP ${ms(r.audits["largest-contentful-paint"].numericValue)}` +
  `   SI ${ms(r.audits["speed-index"].numericValue)}`);

for (const id of [
  "largest-contentful-paint-element",
  "lcp-breakdown-insight",
  "lcp-discovery-insight",
  "prioritize-lcp-image",
  "render-blocking-insight",
  "network-dependency-tree-insight",
]) {
  const a = r.audits[id];
  if (!a) continue;
  console.log(`\n── ${id}  (score ${a.score}) ${a.displayValue ?? ""}`);
  if (a.explanation) console.log(`   ${a.explanation}`);

  const print = (items, depth) => {
    for (const item of items ?? []) {
      const pad = "   ".repeat(depth + 1);
      const bits = [];
      if (item.node) bits.push(`node ${(item.node.selector || item.node.snippet || "").slice(0, 90)}`);
      if (item.phase) bits.push(`${item.phase}: ${ms(item.timing ?? 0)}`);
      if (item.label) bits.push(String(item.label));
      if (item.url) bits.push(String(item.url).replace(URL_ARG, "/").slice(0, 80));
      if (typeof item.duration === "number") bits.push(ms(item.duration));
      if (typeof item.wastedMs === "number") bits.push(`wasted ${ms(item.wastedMs)}`);
      if (typeof item.navStartToLoadEnd === "number") bits.push(`chain ${ms(item.navStartToLoadEnd)}`);
      if (bits.length) console.log(pad + bits.join("   "));
      print(item.items ?? item.children, depth + 1);
    }
  };
  print(a.details?.items ?? a.details?.chains ?? a.details?.nodes, 0);
}
