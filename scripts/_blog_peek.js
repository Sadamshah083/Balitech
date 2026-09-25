/**
 * Checks whether the blog index is actually listing articles.
 *
 *   node scripts/_blog_peek.js [origin]
 */
const ORIGIN = (process.argv[2] || "https://balitech.org").replace(/\/$/, "");

(async () => {
  const html = await (await fetch(`${ORIGIN}/blog`)).text();

  const links = [...new Set([...html.matchAll(/href="(\/blog\/[^"#?]+)"/g)].map((m) => m[1]))];
  console.log(`\n${ORIGIN}/blog\n`);
  console.log(`   links to individual articles: ${links.length}`);
  for (const l of links) console.log(`     ${l}`);

  for (const marker of ["No articles", "no posts", "Coming soon", "nothing here", "empty"]) {
    if (html.toLowerCase().includes(marker.toLowerCase())) {
      console.log(`\n   page says: "${marker}"`);
    }
  }

  /* What the API believes, which separates "the build read an empty table" from
     "the page fails to render rows it has". */
  try {
    const res = await fetch(`${ORIGIN}/api/blogs`);
    const text = await res.text();
    console.log(`\n   /api/blogs -> ${res.status}, ${text.slice(0, 200)}`);
  } catch (e) {
    console.log(`\n   /api/blogs -> ${e.message}`);
  }
  console.log("");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
