/**
 * Reports which pages render each image, and fails when a photo is shared
 * across pages.
 *
 *   node scripts/_check_media.js [origin]
 *
 * Repeated photography was the main thing that made the old site feel thin, so
 * the rule is that every photo belongs to exactly one page. Anything the
 * gallery publishes is called out separately, since a gallery photo turning up
 * on a marketing page is the case that gets noticed first.
 *
 * Which folder a file sits in says nothing about which page owns it — the
 * placements in `page-imagery.ts` decide that, and /gallery skips whatever is
 * reserved there.
 */
const ORIGIN = process.argv[2] || "http://localhost:3200";

const PAGES = [
  "/",
  "/services",
  "/about",
  "/our-team",
  "/gallery",
  "/blog",
  "/join-us",
  "/our-offices",
];

/* Brand furniture is meant to be on every page. */
const CHROME = [/^\/bali-tech-logo\./, /^\/banners\//, /^\/herovideo\//];

/** Next serves images as /_next/image?url=<encoded>, so unwrap back to source. */
function sourcePath(raw) {
  const match = /\/_next\/image\?url=([^&"]+)/.exec(raw);
  const url = match ? decodeURIComponent(match[1]) : raw;
  return url.split("?")[0];
}

function collect(html) {
  const found = new Set();

  for (const m of html.matchAll(/(?:src|poster)="([^"]+)"/g)) {
    const path = sourcePath(m[1]);
    if (/\.(webp|jpe?g|png|avif|mp4)$/i.test(path)) found.add(path);
  }

  /* Backgrounds set from inline styles are easy to miss otherwise. */
  for (const m of html.matchAll(/url\((?:&quot;|['"])?([^)'"]+?\.(?:webp|jpe?g|png|avif))/gi)) {
    found.add(sourcePath(m[1]));
  }

  return found;
}

(async () => {
  /** @type {Map<string, string[]>} */
  const owners = new Map();

  for (const page of PAGES) {
    const res = await fetch(`${ORIGIN}${page}`);
    if (!res.ok) throw new Error(`${page} responded ${res.status}`);

    for (const asset of collect(await res.text())) {
      if (CHROME.some((pattern) => pattern.test(asset))) continue;
      owners.set(asset, [...(owners.get(asset) ?? []), page]);
    }
  }

  const leaks = [];
  const shared = [];

  for (const [asset, pages] of [...owners].sort()) {
    if (pages.length < 2) continue;
    (pages.includes("/gallery") ? leaks : shared).push({ asset, pages });
  }

  console.log(`\nmedia probe — ${ORIGIN}`);
  console.log(`${owners.size} photos across ${PAGES.length} pages\n`);

  if (leaks.length) {
    console.log("GALLERY PHOTO ALSO SHOWN OUTSIDE THE GALLERY");
    for (const { asset, pages } of leaks) {
      console.log(`  ${decodeURIComponent(asset)}\n    -> ${pages.join(", ")}`);
    }
    console.log("");
  }

  if (shared.length) {
    console.log("SAME PHOTO ON MORE THAN ONE PAGE");
    for (const { asset, pages } of shared) {
      console.log(`  ${decodeURIComponent(asset)}\n    -> ${pages.join(", ")}`);
    }
    console.log("");
  }

  if (!leaks.length && !shared.length) {
    console.log("PASS — every photo belongs to exactly one page");
  } else {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
