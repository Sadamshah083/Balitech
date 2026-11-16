const sharp = require("sharp");
const d = "C:/Users/dev/AppData/Local/Temp/claude/dd0350498718fc14/97789e1c-79fa-4bc4-afb5-b984afa4e1d5/images/";
const out = "public/hero/slides/";
async function save(buf, name) {
  const t = await sharp(buf).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).webp({ quality: 86, alphaQuality: 95 }).toBuffer({ resolveWithObject: true });
  require("fs").writeFileSync(out + name, t.data);
  console.log(name, t.info.width, t.info.height, Math.round(t.data.length / 1024) + "KB");
}
(async () => {
  await save(await sharp(d + "25.png").ensureAlpha().png().toBuffer(), "hero-slide-9.webp");
  await save(await sharp(d + "27.png").ensureAlpha().png().toBuffer(), "hero-slide-11.webp");
  // 26 has a white backdrop: flood-fill white connected to the border to transparent.
  const { data, info } = await sharp(d + "26.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const white = (i) => data[i] >= 238 && data[i + 1] >= 238 && data[i + 2] >= 238;
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const p = y * w + x; if (seen[p]) return; if (!white(p * 4)) return; seen[p] = 1; stack.push(p); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) { const p = stack.pop(); const x = p % w, y = (p / w) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let p = 0; p < w * h; p++) if (seen[p]) data[p * 4 + 3] = 0;
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  // soften the cut edge slightly
  const alpha = await sharp(png).extractChannel(3).blur(0.7).toBuffer();
  const rgb = await sharp(png).removeAlpha().toBuffer();
  const soft = await sharp(rgb).joinChannel(alpha).png().toBuffer();
  await save(soft, "hero-slide-10.webp");
})();
