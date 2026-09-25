/**
 * Lists the headings a page renders, which is the stable way to count repeated
 * content on pages built out of utility classes.
 *
 *   node scripts/_headings_peek.js [origin] [...paths]
 */
const ORIGIN = (process.argv[2] || "https://balitech.org").replace(/\/$/, "");
const PATHS = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["/our-offices", "/blog", "/our-team", "/services"];

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

(async () => {
  for (const p of PATHS) {
    const res = await fetch(ORIGIN + p);
    const html = await res.text();
    const heads = [...html.matchAll(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/g)]
      .map((m) => `${m[1]}  ${strip(m[2])}`)
      .filter((h) => h.length > 5);

    console.log(`\n==== ${p}   ${res.status}`);
    for (const h of heads.slice(0, 26)) console.log(`   ${h.slice(0, 88)}`);
    if (heads.length > 26) console.log(`   ... and ${heads.length - 26} more`);
  }
  console.log("");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
