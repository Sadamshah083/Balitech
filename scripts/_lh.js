/**
 * Lighthouse runner with a compact, diffable report.
 *
 *   node scripts/_lh.js [url] [--desktop] [--runs=3] [--only=performance,accessibility]
 *
 * Defaults to the local production server so a full deploy isn't needed between
 * iterations. Median of N runs, because single Lighthouse runs are noisy enough
 * to hide a real 5-point change.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const DESKTOP = has("desktop");
const RUNS = Number(flag("runs", 3));
const CPU = Number(flag("cpu", 1));
const CATEGORIES = flag("only", "performance,accessibility,best-practices,seo").split(",");

const METRICS = [
  ["first-contentful-paint", "FCP"],
  ["largest-contentful-paint", "LCP"],
  ["total-blocking-time", "TBT"],
  ["cumulative-layout-shift", "CLS"],
  ["speed-index", "SI"],
  ["interactive", "TTI"],
];

function runOnce(index) {
  const out = path.join(os.tmpdir(), `lh-${process.pid}-${index}.json`);
  const cliArgs = [
    "--yes",
    "lighthouse",
    URL_ARG,
    "--output=json",
    `--output-path=${out}`,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-extensions",
    `--only-categories=${CATEGORIES.join(",")}`,
  ];
  if (DESKTOP) cliArgs.push("--preset=desktop");
  /* PageSpeed Insights runs on a shared VM that is a good deal slower than a
     development machine, and the difference is not cosmetic: the same build
     measured TBT 0.04s here and 8.17s there. Slowing the CPU reproduces that
     class of problem locally instead of guessing at it. Applied after the
     preset so it overrides the preset's own multiplier. */
  if (CPU !== 1) cliArgs.push(`--throttling.cpuSlowdownMultiplier=${CPU}`);

  const res = spawnSync("npx", cliArgs, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  if (!fs.existsSync(out)) {
    console.error(res.stderr || res.stdout || "lighthouse produced no report");
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  fs.unlinkSync(out);
  return report;
}

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const reports = [];
for (let i = 0; i < RUNS; i += 1) {
  process.stdout.write(`run ${i + 1}/${RUNS} ... `);
  const r = runOnce(i);
  const perf = Math.round((r.categories.performance?.score ?? 0) * 100);
  console.log(`perf ${perf}`);
  reports.push(r);
}

const last = reports[reports.length - 1];
console.log(`\n${DESKTOP ? "DESKTOP" : "MOBILE"}  ${URL_ARG}   (median of ${RUNS})\n`);

console.log("scores");
for (const key of CATEGORIES) {
  const scores = reports.map((r) => Math.round((r.categories[key]?.score ?? 0) * 100));
  const label = last.categories[key]?.title ?? key;
  console.log(`   ${label.padEnd(16)} ${String(median(scores)).padStart(3)}   [${scores.join(" ")}]`);
}

console.log("\nmetrics");
for (const [id, label] of METRICS) {
  const vals = reports.map((r) => r.audits[id]?.numericValue ?? 0);
  const scores = reports.map((r) => Math.round((r.audits[id]?.score ?? 0) * 100));
  const m = median(vals);
  const shown = id === "cumulative-layout-shift" ? m.toFixed(3) : `${(m / 1000).toFixed(2)}s`;
  console.log(`   ${label.padEnd(5)} ${shown.padStart(8)}   score ${String(median(scores)).padStart(3)}`);
}

if (CATEGORIES.includes("performance")) {
  console.log("\ntop opportunities / diagnostics");
  const rows = Object.values(last.audits)
    .filter((a) => a.details && typeof a.details.overallSavingsMs === "number" && a.details.overallSavingsMs > 0)
    .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
    .slice(0, 8);
  for (const a of rows) {
    const bytes = a.details.overallSavingsBytes ? ` / ${(a.details.overallSavingsBytes / 1024).toFixed(0)} KiB` : "";
    console.log(`   ${String(Math.round(a.details.overallSavingsMs)).padStart(5)} ms${bytes.padEnd(12)} ${a.title}`);
  }

  const lcpEl = last.audits["largest-contentful-paint-element"];
  if (lcpEl?.details?.items?.length) {
    console.log("\nLCP element");
    const node = lcpEl.details.items[0]?.items?.[0]?.node ?? lcpEl.details.items[0]?.node;
    if (node) console.log(`   ${(node.selector || node.snippet || "").slice(0, 140)}`);
    const phases = lcpEl.details.items.find((i) => i.type === "table")?.items ?? [];
    for (const p of phases) console.log(`   ${String(p.phase).padEnd(22)} ${p.timing?.toFixed?.(0) ?? p.timing} ms`);
  }

  const blocking = last.audits["render-blocking-resources"];
  if (blocking?.details?.items?.length) {
    console.log("\nrender-blocking");
    for (const i of blocking.details.items.slice(0, 5)) {
      console.log(`   ${String(Math.round(i.wastedMs)).padStart(5)} ms  ${(i.url || "").slice(-70)}`);
    }
  }

  const longTasks = last.audits["long-tasks"];
  if (longTasks?.details?.items?.length) {
    console.log("\nlongest main-thread tasks");
    for (const i of longTasks.details.items.slice(0, 6)) {
      console.log(`   ${String(Math.round(i.duration)).padStart(5)} ms  ${(i.url || "").slice(-70)}`);
    }
  }

  /* The total on its own says "the page is slow"; the split says which half of
     the engine to go and look at. Scripting points at the bundle, style and
     layout at the stylesheet and the size of the DOM, paint and composite at
     the visual effects — and on this site those are not the same problem. */
  const work = last.audits["mainthread-work-breakdown"];
  if (work?.details?.items?.length) {
    console.log("\nmain-thread work by kind");
    const rows = [...work.details.items].sort((a, b) => b.duration - a.duration);
    const total = rows.reduce((n, r) => n + r.duration, 0) || 1;
    for (const r of rows) {
      const share = ((r.duration / total) * 100).toFixed(0);
      console.log(
        `   ${String(Math.round(r.duration)).padStart(6)} ms  ${String(share).padStart(3)}%  ${r.groupLabel}`
      );
    }
  }

  const numeric = [
    ["mainthread-work-breakdown", "main-thread work"],
    ["bootup-time", "script evaluation"],
    ["total-byte-weight", "total payload"],
    ["dom-size", "DOM elements"],
    ["unused-javascript", "unused JS"],
  ];
  console.log("\ndiagnostic values");
  for (const [id, label] of numeric) {
    const a = last.audits[id];
    if (a) console.log(`   ${label.padEnd(20)} ${a.displayValue ?? "-"}`);
  }

  /* Per-file rather than per-audit. The headline "1,444 KiB unused" is only
     actionable once you know which chunks it is spread across, and whether any
     of them are the page's own code rather than an extension's. */
  const shortUrl = (u = "") => {
    if (!u) return "(inline / unattributed)";
    if (u.startsWith("chrome-extension://")) return "EXTENSION " + u.slice(19, 55);
    try {
      const p = new URL(u).pathname;
      return p.length > 62 ? "…" + p.slice(-61) : p;
    } catch {
      return u.slice(0, 62);
    }
  };

  const unused = last.audits["unused-javascript"];
  if (unused?.details?.items?.length) {
    console.log("\nunused JS by file");
    for (const i of unused.details.items.slice(0, 10)) {
      const total = (i.totalBytes / 1024).toFixed(0);
      const waste = (i.wastedBytes / 1024).toFixed(0);
      console.log(`   ${waste.padStart(5)} KiB unused of ${total.padStart(5)} KiB  ${shortUrl(i.url)}`);
    }
  }

  const bootup = last.audits["bootup-time"];
  if (bootup?.details?.items?.length) {
    console.log("\nscript evaluation by file");
    for (const i of bootup.details.items.slice(0, 10)) {
      const evaluate = Math.round(i.scripting ?? 0);
      const parse = Math.round(i.scriptParseCompile ?? 0);
      console.log(`   eval ${String(evaluate).padStart(5)} ms  parse ${String(parse).padStart(4)} ms  ${shortUrl(i.url)}`);
    }
  }

  const legacy = last.audits["legacy-javascript"];
  if (legacy?.details?.items?.length) {
    console.log("\nlegacy JS polyfills/transforms");
    for (const i of legacy.details.items.slice(0, 6)) {
      const waste = ((i.wastedBytes ?? 0) / 1024).toFixed(1);
      const what = (i.subItems?.items ?? []).map((s) => s.signal).filter(Boolean).join(", ");
      console.log(`   ${waste.padStart(6)} KiB  ${shortUrl(i.url)}${what ? "  [" + what.slice(0, 70) + "]" : ""}`);
    }
  }

  const thirdParty = last.audits["third-party-summary"];
  if (thirdParty?.details?.items?.length) {
    console.log("\nthird parties");
    for (const i of thirdParty.details.items.slice(0, 6)) {
      console.log(`   ${String(Math.round(i.blockingTime ?? 0)).padStart(5)} ms blocking  ${((i.transferSize ?? 0) / 1024).toFixed(0).padStart(5)} KiB  ${i.entity?.text ?? i.entity ?? "?"}`);
    }
  }

  const composited = last.audits["non-composited-animations"];
  if (composited?.details?.items?.length) {
    console.log("\nnon-composited animations");
    for (const i of composited.details.items.slice(0, 6)) {
      const why = (i.subItems?.items ?? []).map((s) => s.failureReason).filter(Boolean).join("; ");
      console.log(`   ${String(i.node?.selector ?? "").slice(0, 70)}${why ? "  -> " + why.slice(0, 60) : ""}`);
    }
  }
}

if (CATEGORIES.includes("accessibility")) {
  console.log("\naccessibility failures");
  const fails = Object.values(last.audits).filter(
    (a) => a.score !== null && a.score < 1 && last.categories.accessibility.auditRefs.some((r) => r.id === a.id)
  );
  if (!fails.length) console.log("   none");
  for (const a of fails) {
    const n = a.details?.items?.length ?? 0;
    console.log(`   [${a.id}] ${a.title}${n ? ` (${n} node${n > 1 ? "s" : ""})` : ""}`);
    for (const item of (a.details?.items ?? []).slice(0, 4)) {
      const sel = item.node?.selector ?? item.node?.snippet ?? "";
      if (sel) console.log(`        ${String(sel).slice(0, 120)}`);
    }
  }
}
