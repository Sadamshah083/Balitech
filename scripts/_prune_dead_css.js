/**
 * Removes rules from globals.css whose class families no source file mentions.
 *
 * A class is only treated as dead when the segment before its first `__`/`--`
 * is absent from every source file, so classes composed at runtime (e.g.
 * `` `card__dot${active ? "--active" : ""}` ``) are always kept.
 *
 * Run with `--write` to apply; otherwise it reports what it would remove.
 */
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const CSS_FILE = "src/app/globals.css";
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "backups",
  "logs",
  "public",
  // Audit scripts name classes only to assert they are gone; counting those
  // mentions as usage would keep the very rules we want removed.
  "scripts",
]);
const SCANNED_EXT = /\.(tsx?|jsx?|mjs|cjs|mdx?|html|json|prisma)$/;

function collectSource(dir, chunks = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectSource(full, chunks);
    } else if (SCANNED_EXT.test(entry.name) && full !== CSS_FILE.replace(/\//g, path.sep)) {
      chunks.push(fs.readFileSync(full, "utf8"));
    }
  }
  return chunks;
}

const source = collectSource(".").join("\n");
const rootCache = new Map();

function rootIsUsed(cls) {
  const root = cls.split(/__|--/)[0];
  if (!rootCache.has(root)) rootCache.set(root, source.includes(root));
  return rootCache.get(root);
}

/**
 * A selector can never match if any class it *requires* is absent from the
 * markup. Classes inside `:not()` are stripped first: a negation against a
 * class that never exists is simply always true, so the rule still applies.
 */
function selectorIsDead(selector) {
  const required = selector.replace(/:not\([^)]*\)/g, "");
  const classes = [...required.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]);
  if (classes.length === 0) return false;
  return classes.some((cls) => !source.includes(cls) && !rootIsUsed(cls));
}

const css = fs.readFileSync(CSS_FILE, "utf8");
const root = postcss.parse(css, { from: CSS_FILE });

const removedSelectors = [];
let removedRules = 0;

root.walkRules((rule) => {
  if (rule.parent && rule.parent.type === "atrule" && /keyframes/.test(rule.parent.name)) {
    return;
  }

  const selectors = rule.selectors;
  const kept = selectors.filter((selector) => !selectorIsDead(selector));
  if (kept.length === selectors.length) return;

  removedSelectors.push(...selectors.filter((s) => selectorIsDead(s)));

  if (kept.length === 0) {
    rule.remove();
    removedRules += 1;
  } else {
    rule.selectors = kept;
  }
});

// Drop @media/@supports blocks left empty by the pass above.
let emptyAtRules = 0;
let pass = true;
while (pass) {
  pass = false;
  root.walkAtRules((atRule) => {
    if (/keyframes/.test(atRule.name)) return;
    if (atRule.nodes && atRule.nodes.length === 0) {
      atRule.remove();
      emptyAtRules += 1;
      pass = true;
    }
  });
}

// Drop @keyframes nothing animates anymore.
const output = root.toString();
let removedKeyframes = 0;
root.walkAtRules(/^(-\w+-)?keyframes$/, (atRule) => {
  const name = atRule.params.trim();
  const usagePattern = new RegExp(`(animation[^;}]*|animation-name\\s*:[^;}]*)\\b${name}\\b`);
  if (!usagePattern.test(output) && !source.includes(name)) {
    atRule.remove();
    removedKeyframes += 1;
  }
});

const result = root.toString();
const before = css.split("\n").length;
const after = result.split("\n").length;

console.log(`selectors removed : ${removedSelectors.length}`);
console.log(`rules removed     : ${removedRules}`);
console.log(`empty at-rules    : ${emptyAtRules}`);
console.log(`keyframes removed : ${removedKeyframes}`);
console.log(`lines             : ${before} -> ${after}  (-${before - after})`);
console.log(`bytes             : ${css.length} -> ${result.length}`);

if (process.argv.includes("--verbose")) {
  console.log("\nremoved selectors:");
  for (const selector of removedSelectors.sort()) console.log("  " + selector);
}

if (process.argv.includes("--write")) {
  fs.writeFileSync(CSS_FILE, result);
  console.log(`\nwrote ${CSS_FILE}`);
} else {
  console.log("\ndry run - pass --write to apply");
}
