const fs = require("fs");
const html = fs.readFileSync(
  "C:/Users/dev/.cursor/projects/c-Users-dev-Desktop-Balitech/agent-tools/cdf8e0e2-0753-40d8-b5a0-4c11e98de3cd.txt",
  "utf8"
);
const slugs = [...html.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]);
console.log([...new Set(slugs)].join("\n"));
console.log("count", new Set(slugs).size);
console.log("has_fallback", /scales-us-campaign-operations|high-performing-call-center/.test(html));
console.log("has_live", /inside-a-modern-bpo/.test(html));
