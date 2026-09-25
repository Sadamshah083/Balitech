/**
 * Audits the SEO surface of every public page from the served HTML.
 *
 * Reads what a crawler actually receives rather than trusting the source: one
 * h1, a canonical, a description, valid JSON-LD, and no image missing its alt.
 *
 *   node scripts/_check_seo.js [origin]
 */
const ORIGIN = process.argv[2] || "http://localhost:3200";

const PAGES = [
  "/",
  "/services",
  "/about",
  "/our-team",
  "/gallery",
  "/join-us",
  "/our-offices",
  "/blog",
];

/* Legacy URLs from the previous PHP site, which are still indexed. */
const REDIRECTS = [
  "/contact.php",
  "/index.php",
  "/about.php",
  "/services.php",
  "/careers.php",
  "/gallery.php",
  "/team.php",
  "/blog.php",
];

let pass = 0;
const failures = [];

function check(label, ok, detail = "") {
  if (ok) {
    pass += 1;
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : ` — ${detail}`}`);
}

const all = (html, re) => [...html.matchAll(re)];

/* Lengths have to be measured on the rendered string: `&amp;` is one character
   in a search result but five in the markup. */
const decode = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

(async () => {
  for (const path of PAGES) {
    console.log(`\n${path}`);
    const res = await fetch(`${ORIGIN}${path}`);
    const html = await res.text();

    check("responds 200", res.status === 200, `got ${res.status}`);

    const h1s = all(html, /<h1\b/g).length;
    check("exactly one h1", h1s === 1, `found ${h1s}`);

    /* Google truncates the title around 60 characters and the snippet around
       160, so anything past those is written but never read. */
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    check("title within 60 chars", title.length > 0 && title.length <= 60, `${title.length}: ${title}`);

    const desc = decode(
      html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""
    );
    check(
      "description 70-160 chars",
      desc.length >= 70 && desc.length <= 160,
      `${desc.length} chars: ${desc.slice(0, 60)}…`
    );

    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    const expected = `https://balitech.org${path === "/" ? "" : path}`;
    check("canonical points at this page", canonical === expected, `${canonical}`);

    check("og:image present", /property="og:image"/.test(html));

    const blocks = all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    let parsed = 0;
    const types = [];
    for (const [, body] of blocks) {
      try {
        const json = JSON.parse(body);
        parsed += 1;
        types.push(json["@type"]);
      } catch {
        /* counted as a failure below */
      }
    }
    check("all JSON-LD blocks parse", blocks.length > 0 && parsed === blocks.length, `${parsed}/${blocks.length}`);
    check("declares a breadcrumb trail", path === "/" || types.includes("BreadcrumbList"), types.join(", "));

    /* `alt` may legitimately be empty for decorative images; missing is the bug. */
    const imgs = all(html, /<img\b[^>]*>/g).map(([tag]) => tag);
    const noAlt = imgs.filter((tag) => !/\balt=/.test(tag));
    check("every img has an alt attribute", noAlt.length === 0, `${noAlt.length} of ${imgs.length} missing`);

    const noSizes = imgs.filter(
      (tag) => !/\bsizes=/.test(tag) && !/\bwidth=/.test(tag)
    );
    check("every img is dimensioned", noSizes.length === 0, `${noSizes.length} unsized`);
  }

  console.log("\nlegacy redirects");
  for (const path of REDIRECTS) {
    const res = await fetch(`${ORIGIN}${path}`, { redirect: "manual" });
    check(`${path} -> 308`, res.status === 308 || res.status === 301, `got ${res.status}`);
  }

  console.log("\ncrawler files");
  const robots = await fetch(`${ORIGIN}/robots.txt`);
  const robotsBody = await robots.text();
  check("robots.txt served", robots.status === 200);
  check("robots.txt points at the sitemap", /Sitemap:/i.test(robotsBody));
  check("robots.txt keeps /admin out", /Disallow:\s*\/admin/i.test(robotsBody));

  const sitemap = await fetch(`${ORIGIN}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  check("sitemap.xml served", sitemap.status === 200);
  const listed = all(sitemapBody, /<loc>([^<]+)<\/loc>/g).map(([, u]) => u);
  const missing = PAGES.map((p) => `https://balitech.org${p === "/" ? "" : p}`).filter(
    (u) => !listed.includes(u)
  );
  check("sitemap lists every public page", missing.length === 0, missing.join(", "));

  console.log(
    `\n${"─".repeat(52)}\n${pass}/${pass + failures.length} checks passed`
  );
  if (failures.length) {
    console.log("\nfailures:");
    for (const f of failures) console.log("  " + f);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
