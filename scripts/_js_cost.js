/**
 * Per-script cost breakdown from a single Lighthouse run.
 *
 *   node scripts/_js_cost.js [url]
 *
 * `_lh.js` reports the totals; this answers the follow-up question of which
 * individual bundle is responsible, which is the only way to tell an
 * unavoidable framework cost from something that should not be on the critical
 * path at all.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const URL_ARG = process.argv[2] || "http://127.0.0.1:3300/";
const out = path.join(os.tmpdir(), `lh-cost-${process.pid}.json`);

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
const name = (u) => (u || "").split("/").pop() || u;

const boot = r.audits["bootup-time"]?.details?.items ?? [];
if (boot.length) {
  console.log("\nscript evaluation (main-thread ms per file)");
  console.log("   parse+compile   execute    total   file");
  for (const i of boot.slice(0, 14)) {
    console.log(
      `   ${String(Math.round(i.scriptParseCompile)).padStart(11)}` +
        `   ${String(Math.round(i.scripting)).padStart(7)}` +
        `   ${String(Math.round(i.total)).padStart(6)}   ${name(i.url)}`
    );
  }
}

const tree = r.audits["script-treemap-data"]?.details?.nodes ?? [];
if (tree.length) {
  console.log("\nbundle contents (resource bytes / unused bytes)");
  const flat = [];
  const walk = (node, file) => {
    if (node.children) {
      for (const c of node.children) walk(c, file);
      return;
    }
    flat.push({ file, name: node.name, bytes: node.resourceBytes || 0, unused: node.unusedBytes || 0 });
  };
  for (const n of tree) walk(n, name(n.name));
  flat.sort((a, b) => b.bytes - a.bytes);
  for (const f of flat.slice(0, 20)) {
    console.log(`   ${kb(f.bytes).padStart(9)}  ${kb(f.unused).padStart(9)} unused   ${f.name.slice(0, 78)}`);
  }
}

const chains = r.audits["network-dependency-tree-insight"] ?? r.audits["critical-request-chains"];
const longest = chains?.details?.chains ?? chains?.details?.longestChain;
if (longest) console.log(`\ncritical chain: ${JSON.stringify(longest).slice(0, 300)}`);

const blocking = r.audits["render-blocking-resources"]?.details?.items ?? [];
if (blocking.length) {
  console.log("\nrender-blocking");
  for (const i of blocking) {
    console.log(`   ${String(Math.round(i.wastedMs)).padStart(5)} ms  ${kb(i.totalBytes).padStart(9)}  ${name(i.url)}`);
  }
}

for (const id of ["lcp-breakdown-insight", "largest-contentful-paint-element"]) {
  const a = r.audits[id];
  const items = a?.details?.items ?? [];
  if (!items.length) continue;
  console.log(`\n${id}`);
  for (const i of items) {
    if (i.node) console.log(`   node: ${(i.node.selector || i.node.snippet || "").slice(0, 120)}`);
    if (i.phase) console.log(`   ${String(i.phase).padEnd(24)} ${Math.round(i.timing)} ms`);
    for (const sub of i.items ?? []) {
      if (sub.node) console.log(`   node: ${(sub.node.selector || sub.node.snippet || "").slice(0, 120)}`);
      if (sub.phase) console.log(`   ${String(sub.phase).padEnd(24)} ${Math.round(sub.timing)} ms`);
    }
  }
}
