/**
 * Builds web-sized derivatives of the few originals that ship straight to the
 * browser, and leaves every source file untouched.
 *
 *   node scripts/optimize-media.js          # only what is missing or stale
 *   node scripts/optimize-media.js --force  # rebuild everything
 *
 * Two kinds of asset need this. The hero clip is a 4K 60fps camera export that
 * plays muted in a panel a few hundred pixels wide, and the page banners are
 * CSS backgrounds, so `next/image` never sees them and the full-size original
 * goes over the wire. Everything else on the site is rendered through
 * `next/image` and is already resized on demand.
 */
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs");
const path = require("node:path");

const run = promisify(execFile);
const FORCE = process.argv.includes("--force");
const PUBLIC = path.join(__dirname, "..", "public");

const HERO_SOURCE = "herovideo/Balitech hero video.mp4";

/**
 * The hero panel is roughly 700 CSS px wide at its largest, so 1280 is still
 * oversampled on a 2x display. Dropping the 60fps and the (muted) audio track
 * costs nothing visible, and every megabyte here is a megabyte the browser
 * isn't spending on the first paint.
 */
const VIDEO = {
  source: HERO_SOURCE,
  mp4: "herovideo/balitech-hero-1080.mp4",
  poster: "herovideo/balitech-hero-poster.webp",
  width: 1280,
  crf: 33,
};

/**
 * Every icon file in the repo was the same 1024x1024 JPEG, just renamed — so a
 * 184 KB photograph was being fetched as the favicon on the critical path of
 * every page. These are regenerated at the sizes browsers actually use.
 */
const ICON_SOURCE = "../media-src/icon-source.jpg";
const ICONS = {
  png: "../src/app/icon.png",
  ico: "../src/app/favicon.ico",
  pngSize: 192,
  icoSize: 48,
};

/** Banners are wide crops behind a dark overlay, so quality can be modest. */
const BANNERS = [
  { source: "hero/hero-meeting-new.jpg", out: "banners/services-banner.webp" },
  { source: "gallery/gallery-office-workplace-2.jpg", out: "banners/about-banner.webp" },
];

const BANNER_WIDTH = 1920;
const BANNER_QUALITY = 72;

/**
 * The footer QR code, which encodes one URL that never changes.
 *
 * This used to be generated in the browser: the `qrcode` library was a 59 KB
 * client chunk, and drawing the code to a canvas cost 579 ms of main thread on
 * a throttled phone — 26% of all the JavaScript the home page ran, for
 * something 15,000px below the fold that is identical on every visit. Built
 * here instead, the footer needs no script at all and the download button is a
 * plain link.
 *
 * Drawn at 4x the 112px display size so it stays crisp on dense screens, and
 * kept as PNG because that is also what the download button hands over.
 */
const QR = {
  url: "https://balitech.org",
  out: "balitech-website-qr.png",
  width: 448,
  margin: 2,
  dark: "#0b1220",
  light: "#ffffff",
};

/**
 * Great Vibes, cut down to the intro wordmark.
 *
 * The face renders one string on the whole site — the calligraphy the home page
 * intro writes out — but Google ships the full Latin range, 28.9 KB, as a
 * High-priority request that the largest contentful paint is waiting on. The
 * twenty characters it actually needs come to 3.7 KB.
 *
 * The glyph list is read from HERO_INTRO_WORDMARK rather than repeated here, so
 * changing the wording cannot leave the font missing a letter. The master is
 * the unmodified Google Latin subset, kept in `media-src` so this never needs
 * the network.
 */
const SCRIPT_FONT = {
  source: "../media-src/great-vibes-latin.woff2",
  out: "fonts/great-vibes-intro.woff2",
};

const abs = (rel) => path.join(PUBLIC, rel);
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

function stale(source, target) {
  if (FORCE || !fs.existsSync(abs(target))) return true;
  return fs.statSync(abs(source)).mtimeMs > fs.statSync(abs(target)).mtimeMs;
}

function report(source, target) {
  const from = fs.statSync(abs(source)).size;
  const to = fs.statSync(abs(target)).size;
  const saved = (100 * (1 - to / from)).toFixed(0);
  console.log(`  ${target}\n    ${kb(from)} -> ${kb(to)}  (-${saved}%)`);
}

/**
 * Wraps a PNG in a single-entry ICO. Browsers have accepted PNG-payload icons
 * since Vista, and it avoids pulling in a converter dependency for one file.
 */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

async function buildIcons() {
  const sharp = require("sharp");
  const source = abs(ICON_SOURCE);

  if (!fs.existsSync(source)) {
    console.log(`  skipped — ${ICON_SOURCE} is missing`);
    return;
  }

  const before = fs.statSync(abs(ICONS.png)).size;

  await sharp(source)
    .resize(ICONS.pngSize, ICONS.pngSize, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(abs(ICONS.png));

  // Next's icon pipeline decodes the .ico and rejects palette PNGs, so this
  // payload stays full RGBA.
  const icoPng = await sharp(source)
    .resize(ICONS.icoSize, ICONS.icoSize, { fit: "cover" })
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(abs(ICONS.ico), pngToIco(icoPng, ICONS.icoSize));

  console.log(
    `  icon.png\n    ${kb(before)} -> ${kb(fs.statSync(abs(ICONS.png)).size)}`
  );
  console.log(
    `  favicon.ico\n    ${kb(before)} -> ${kb(fs.statSync(abs(ICONS.ico)).size)}`
  );
}

async function buildVideo() {
  const { source, mp4, poster } = VIDEO;

  if (!fs.existsSync(abs(source))) {
    console.log(`  skipped — ${source} is missing`);
    return;
  }

  fs.mkdirSync(path.dirname(abs(mp4)), { recursive: true });

  /* `-movflags +faststart` puts the index up front so playback can begin
     before the whole file has arrived. */
  if (stale(source, mp4)) {
    await run("ffmpeg", [
      "-y", "-i", abs(source),
      "-an",
      "-vf", `scale=${VIDEO.width}:-2,fps=30`,
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", String(VIDEO.crf),
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      abs(mp4),
    ]);
    report(source, mp4);
  }

  /* A poster means the panel is never empty while the clip loads. */
  if (stale(source, poster)) {
    await run("ffmpeg", [
      "-y", "-ss", "1", "-i", abs(source),
      "-frames:v", "1",
      "-vf", "scale=1280:-2",
      "-quality", "70",
      abs(poster),
    ]);
    console.log(`  ${poster}\n    ${kb(fs.statSync(abs(poster)).size)}`);
  }
}

async function buildBanners() {
  const sharp = require("sharp");

  for (const { source, out } of BANNERS) {
    if (!fs.existsSync(abs(source))) {
      console.log(`  skipped — ${source} is missing`);
      continue;
    }
    if (!stale(source, out)) continue;

    fs.mkdirSync(path.dirname(abs(out)), { recursive: true });
    await sharp(abs(source))
      .resize({ width: BANNER_WIDTH, withoutEnlargement: true })
      .webp({ quality: BANNER_QUALITY })
      .toFile(abs(out));
    report(source, out);
  }
}

async function buildQr() {
  if (!FORCE && fs.existsSync(abs(QR.out))) return;

  await require("qrcode").toFile(abs(QR.out), QR.url, {
    width: QR.width,
    margin: QR.margin,
    color: { dark: QR.dark, light: QR.light },
    errorCorrectionLevel: "M",
  });
  console.log(`  ${QR.out}\n    ${kb(fs.statSync(abs(QR.out)).size)}  ${QR.url}`);
}

async function buildScriptFont() {
  if (!fs.existsSync(abs(SCRIPT_FONT.source))) {
    console.log(`  skipped — ${SCRIPT_FONT.source} is missing`);
    return;
  }
  if (!stale(SCRIPT_FONT.source, SCRIPT_FONT.out)) return;

  /* Read straight out of the TypeScript source: this script is plain CommonJS
     and the constant is a plain string literal, so a regex is enough and avoids
     pulling a transpiler into the media pipeline for one value. */
  const heroLoader = fs.readFileSync(
    path.join(__dirname, "..", "src", "lib", "hero-loader.ts"),
    "utf8"
  );
  const match = heroLoader.match(/HERO_INTRO_WORDMARK\s*=\s*"([^"]+)"/);
  if (!match) throw new Error("Could not read HERO_INTRO_WORDMARK from hero-loader.ts");

  const subsetFont = require("subset-font");
  const subset = await subsetFont(fs.readFileSync(abs(SCRIPT_FONT.source)), match[1], {
    targetFormat: "woff2",
  });

  fs.mkdirSync(path.dirname(abs(SCRIPT_FONT.out)), { recursive: true });
  fs.writeFileSync(abs(SCRIPT_FONT.out), subset);
  console.log(`  ${SCRIPT_FONT.out}\n    ${kb(subset.length)}  for "${match[1]}"`);
}

(async () => {
  console.log("\nicons");
  await buildIcons();

  console.log("\nhero clip");
  await buildVideo();

  console.log("\npage banners");
  await buildBanners();

  console.log("\nfooter QR");
  await buildQr();

  console.log("\nintro script font");
  await buildScriptFont();

  console.log("");
})().catch((error) => {
  console.error(error.stderr || error.message);
  process.exit(1);
});
