/**
 * Local UI audit: crawls every public page and checks the things that were
 * reported broken — repeated photos, missing home-page job cards, and the
 * intro animation markup.
 *
 *   node scripts/_verify_ui.js [baseUrl]
 */

const BASE = process.argv[2] || "http://localhost:3200";

const PAGES = [
  ["Home", "/"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Our Growth", "/our-team"],
  ["Gallery", "/gallery"],
  ["Careers", "/join-us"],
  ["Insights", "/blog"],
  ["Offices", "/our-offices"],
];

let failures = 0;
let checks = 0;

function check(ok, label, detail) {
  checks += 1;
  if (ok) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}`);
    if (detail) console.log(`        ${detail}`);
  }
}

/**
 * Normalises every image reference to the underlying asset path.
 *
 * aria-hidden images are skipped: they are the letterbox backdrop layers and
 * marquee clones, which are the same file by design and carry no content.
 */
function extractImages(html) {
  const found = [];

  for (const match of html.matchAll(/<img\b([^>]*?)\ssrc="([^"]+)"([^>]*)>/g)) {
    const attrs = match[1] + match[3];
    if (/aria-hidden="true"/.test(attrs)) continue;

    let src = match[2];

    if (src.startsWith("/_next/image")) {
      const params = new URLSearchParams(src.slice(src.indexOf("?") + 1));
      src = params.get("url") || src;
    }

    try {
      src = decodeURIComponent(src);
    } catch {
      /* leave as-is when not valid percent-encoding */
    }

    if (src.startsWith("data:")) continue;
    found.push(src);
  }

  return found;
}

/** Photos that are legitimately repeated as decoration, not content. */
const CHROME_IMAGES = [/bali-tech-logo/, /brand-hero-/, /^\/logo\.png$/];

function isContentImage(src) {
  return !CHROME_IMAGES.some((pattern) => pattern.test(src));
}

async function run() {
  console.log(`Auditing ${BASE}\n`);

  const perPage = new Map();

  for (const [name, path] of PAGES) {
    const res = await fetch(`${BASE}${path}`);
    const html = await res.text();

    console.log(`${name}  (${path})`);
    check(res.status === 200, `responds 200`, `got ${res.status}`);

    const images = extractImages(html).filter(isContentImage);
    perPage.set(name, new Set(images));

    // Same photo rendered twice on one page
    const counts = new Map();
    for (const src of images) counts.set(src, (counts.get(src) || 0) + 1);
    const repeats = [...counts.entries()].filter(([, n]) => n > 1);

    check(
      repeats.length === 0,
      `no repeated photo within the page (${images.length} images)`,
      repeats.map(([src, n]) => `${src} x${n}`).join("\n        ")
    );

    console.log("");
  }

  // Same photo used as a feature on two different pages
  console.log("Cross-page photo reuse");
  const owners = new Map();
  for (const [page, images] of perPage) {
    for (const src of images) {
      if (!owners.has(src)) owners.set(src, []);
      owners.get(src).push(page);
    }
  }
  const shared = [...owners.entries()].filter(([, pages]) => pages.length > 1);
  check(
    shared.length === 0,
    "every photo belongs to exactly one page",
    shared.map(([src, pages]) => `${src} -> ${pages.join(", ")}`).join("\n        ")
  );
  console.log("");

  // Home page careers block
  console.log("Home page hiring cards");
  const home = await (await fetch(`${BASE}/`)).text();
  const applyLinks = [
    ...home.matchAll(/href="\/join-us\?campaign=([^"&]+)[^"]*#apply"/g),
  ].map((m) => decodeURIComponent(m[1]));

  check(
    home.includes('id="careers"'),
    "renders the careers section"
  );
  check(
    applyLinks.length >= 4,
    `renders job cards linking into the form (${applyLinks.length} found)`,
    applyLinks.join(", ")
  );
  check(
    home.includes("Apply Now"),
    "cards expose an Apply Now action"
  );
  console.log("");

  // Apply link actually opens the form with the campaign preselected
  console.log("Apply Now target");
  if (applyLinks.length > 0) {
    const target = `/join-us?campaign=${encodeURIComponent(applyLinks[0])}#apply`;
    const res = await fetch(`${BASE}${target}`);
    const html = await res.text();
    check(res.status === 200, `${target} responds 200`, `got ${res.status}`);
    check(html.includes('id="apply"'), "application form section is present");
    check(
      html.includes("Applying for campaign") || html.includes("join-us-form"),
      "form renders for the selected campaign"
    );
  }
  console.log("");

  // Intro animation
  console.log("Intro animation");
  check(
    home.includes("hero-intro__script-ink"),
    "script reveal renders as one connected string"
  );
  check(
    !home.includes("hero-loader__char"),
    "per-character spans removed (they broke script kerning)"
  );
  check(
    home.includes("Welcome to Bali Tech"),
    "welcome copy present in server HTML"
  );
  console.log("");

  // Typography — next/font emits hashed variable classes on <html>
  console.log("Typography");
  const htmlTag = home.match(/<html[^>]*>/)?.[0] ?? "";
  for (const family of ["outfit", "plus_jakarta_sans", "great_vibes"]) {
    check(
      new RegExp(`${family}_[a-z0-9]+-module__[^\\s"]+__variable`).test(htmlTag),
      `${family} font variable is applied`
    );
  }
  check(
    !home.includes("fonts.googleapis.com"),
    "no blocking Google Fonts stylesheet (fonts are self-hosted)"
  );
  console.log("");

  // Showcase sections
  console.log("Photo showcases");
  const careers = await (await fetch(`${BASE}/join-us`)).text();
  const gallery = await (await fetch(`${BASE}/gallery`)).text();
  check(
    careers.includes('id="moments-title"'),
    "careers page renders the Moments showcase"
  );
  check(
    gallery.includes('id="recognition-title"'),
    "gallery page renders the Award Distribution showcase"
  );
  check(
    !gallery.includes('id="moments-title"'),
    "Moments showcase is not duplicated onto the gallery page"
  );
  check(
    careers.includes("showcase-frame__backdrop"),
    "frames use the letterbox backdrop so photos are never cropped"
  );
  check(
    !careers.includes("events-gallery-showcase__slide"),
    "old overlapping-pair carousel is gone"
  );
  console.log("");

  console.log("─".repeat(52));
  console.log(`${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error("Audit failed to run:", error.message);
  process.exitCode = 1;
});
