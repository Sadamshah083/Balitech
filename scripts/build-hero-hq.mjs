import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const heroDir = path.join(process.cwd(), "public", "hero");

const sources = [
  {
    file: "C:/Users/dev/.cursor/projects/c-Users-dev-Desktop-Balitech/assets/c__Users_dev_AppData_Roaming_Cursor_User_workspaceStorage_8f1432791c3e3be597ad1afbcd75c691_images_image-d5810ac9-245f-473e-a208-ac402f23e5be.png",
    label: "asset-forest-1024",
  },
  {
    file: path.join(heroDir, "slide-1-team-family.png"),
    label: "slide-1",
  },
  {
    file: path.join(heroDir, "hero-team-group-outdoor.jpg"),
    label: "group-outdoor",
  },
  {
    file: "C:/Users/dev/.cursor/projects/c-Users-dev-Desktop-Balitech/assets/c__Users_dev_AppData_Roaming_Cursor_User_workspaceStorage_8f1432791c3e3be597ad1afbcd75c691_images_image-3dfda6b3-577b-4d87-95ba-eefc758e75da.png",
    label: "asset-forest-800",
  },
].filter((s) => fs.existsSync(s.file));

async function exportHero(srcPath, width, outPath, format) {
  let pipeline = sharp(srcPath).rotate().resize({
    width,
    withoutEnlargement: false,
    fit: "inside",
    kernel: sharp.kernel.lanczos3,
  });

  if (width >= 1920) {
    pipeline = pipeline.sharpen({
      sigma: 0.85,
      m1: 0.8,
      m2: 0.35,
      x1: 2,
      y2: 8,
      y3: 18,
    });
  }

  if (format === "jpeg") {
    await pipeline
      .jpeg({ quality: 98, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(outPath);
  } else {
    await pipeline
      .webp({ quality: 98, effort: 6, smartSubsample: false, nearLossless: true })
      .toFile(outPath);
  }

  const meta = await sharp(outPath).metadata();
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  return { w: meta.width, h: meta.height, kb };
}

const best = sources[0];
if (!best) {
  console.error("No hero source files found.");
  process.exit(1);
}

console.log(`Source: ${best.label}`);

for (const width of [1920, 2560]) {
  const suffix = width === 2560 ? "-2560" : "";
  const jpg = path.join(heroDir, `hero-team-forest-group${suffix}.jpg`);
  const webp = path.join(heroDir, `hero-team-forest-group${suffix}.webp`);
  const jpeg = await exportHero(best.file, width, jpg, "jpeg");
  const webpOut = await exportHero(best.file, width, webp, "webp");
  console.log(
    `${width}px -> JPEG ${jpeg.w}x${jpeg.h} ${jpeg.kb}KB | WebP ${webpOut.w}x${webpOut.h} ${webpOut.kb}KB`
  );
}
