/**
 * Lists the most repeated class names on a page, to find the one that marks a
 * repeated item. Used to write the markers in _content_check.js from what the
 * pages actually render rather than from a guess.
 *
 *   node scripts/_class_peek.js [origin] [...paths]
 */
const ORIGIN = (process.argv[2] || "https://balitech.org").replace(/\/$/, "");
const PATHS = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["/our-offices", "/blog", "/our-team", "/services"];

(async () => {
  for (const p of PATHS) {
    const res = await fetch(ORIGIN + p);
    const html = await res.text();
    const counts = new Map();
    for (const m of html.matchAll(/class="([^"]+)"/g)) {
      for (const cls of m[1].split(/\s+/)) {
        if (!cls || cls.length > 44) continue;
        counts.set(cls, (counts.get(cls) || 0) + 1);
      }
    }
    const top = [...counts.entries()]
      .filter(([c, n]) => n > 1 && n < 60 && /[a-z]/.test(c) && !/^(flex|grid|text|mt|mb|px|py|w|h)-/.test(c))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);

    console.log(`\n==== ${p}   ${res.status}, ${(html.length / 1024).toFixed(0)} KiB`);
    for (const [cls, n] of top) console.log(`   ${String(n).padStart(3)}  ${cls}`);
  }
  console.log("");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
