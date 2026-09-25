const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full.replace(/\\/g, "/"));
  }
  return out;
}

const files = walk("src");
const sources = files.map((f) => ({ f, txt: fs.readFileSync(f, "utf8") }));
const components = files.filter((f) => f.startsWith("src/components/"));

const orphans = components.filter((file) => {
  const aliasPath = file.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
  const name = path.basename(file).replace(/\.tsx?$/, "");
  const relativePattern = new RegExp('from "[^"]*/' + name + '"');

  return !sources.some(
    (s) =>
      s.f !== file &&
      (s.txt.includes(aliasPath) || relativePattern.test(s.txt))
  );
});

console.log("Orphaned components (" + orphans.length + "):");
for (const orphan of orphans) console.log("  " + orphan);
