import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const HERO_DIR = path.join(process.cwd(), "public", "hero");
const TARGET_WIDTH = 1920;
const WEBP_QUALITY = 94;

/** Prefer the highest-res team hero source available in public/hero */
const heroSources = [
  { input: "slide-1-team-family.png", output: "hero-team-forest-group.webp" },
  { input: "hero-team-forest-group.jpg", output: "hero-team-forest-group.webp" },
];

async function optimizeHeroImage({ input, output }) {
  const inputPath = path.join(HERO_DIR, input);
  const outputPath = path.join(HERO_DIR, output);

  if (!fs.existsSync(inputPath)) {
    console.warn(`skip: ${input} (not found)`);
    return;
  }

  const inputMeta = await sharp(inputPath).metadata();
  const result = await sharp(inputPath)
    .rotate()
    .resize({
      width: TARGET_WIDTH,
      withoutEnlargement: false,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25 })
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const inputSize = fs.statSync(inputPath).size;
  console.log(
    `${input} -> ${output}: ${inputMeta.width}x${inputMeta.height} -> ${result.width}x${result.height} | ${Math.round(inputSize / 1024)}KB -> ${Math.round(result.size / 1024)}KB`
  );
}

for (const source of heroSources) {
  await optimizeHeroImage(source);
}
