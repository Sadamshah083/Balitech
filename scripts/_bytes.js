/**
 * Every request the page makes, by transfer size.
 *
 *   node scripts/_bytes.js [url]
 *
 * Lighthouse's simulated LCP for this page tracks total payload rather than the
 * paint the browser actually reports (observed 883 ms against a scored 4.17 s),
 * because its LCP element audit resolves to nothing and the simulator falls
 * back to a graph that waits on everything. Under Slow 4G — 1.6 Mbps — 546 KiB
 * is about 2.7 s of download on its own, so this is the list that matters.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const URL_ARG = process.argv[2] || "http://127.0.0.1:3300/";
const out = path.join(os.tmpdir(), `lh-bytes-${process.pid}.json`);

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

const kb = (n) => `${(n / 1024).toFixed(0)} KiB`;
const items = r.audits["network-requests"]?.details?.items ?? [];

const byType = new Map();
let total = 0;

for (const i of items) {
  const size = i.transferSize || 0;
  total += size;
  const type = i.resourceType || i.mimeType || "other";
  byType.set(type, (byType.get(type) ?? 0) + size);
}

console.log(`\n${URL_ARG}\n\n${items.length} requests, ${kb(total)} transferred\n`);

console.log("by type");
for (const [type, size] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  const pct = ((size / total) * 100).toFixed(0);
  console.log(`   ${kb(size).padStart(9)}  ${pct.padStart(3)}%  ${type}`);
}

console.log("\nlargest requests");
console.log("  transfer   type          priority  url");
for (const i of items.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 22)) {
  if ((i.transferSize || 0) < 2048) break;
  const url = String(i.url).replace(URL_ARG, "/");
  const name = url.length > 62 ? `...${url.slice(-59)}` : url;
  console.log(
    `  ${kb(i.transferSize || 0).padStart(8)}   ${String(i.resourceType || "").padEnd(12)}  ` +
      `${String(i.priority || "").padEnd(8)}  ${name}`
  );
}
