/** Captures every hero carousel slide into one contact sheet (local debugging aid). */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, connect, sleep } = require("./_chrome");

const OUT = process.argv[2] || "tmp/hero-slides.png";
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: W < 900 }, sessionId);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/" }, sessionId);
    await sleep(9000);
    const ev = async (expression) =>
      (await cdp.send("Runtime.evaluate", { expression, returnByValue: true }, sessionId)).result.value;

    const rect = await ev(`(() => { const r = document.querySelector('.hero-stage').getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`);
    const r = JSON.parse(rect);
    const pad = r.w * 0.2;
    const clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 1.6, scale: 1 };

    const tiles = [];
    for (let i = 0; i < 11; i++) {
      await ev(`document.querySelectorAll('.hero-carousel__dot')[${i}].click(); 'ok'`);
      await ev(`document.querySelector('.hero-carousel').dispatchEvent(new MouseEvent('mouseenter')); 'ok'`);
      await sleep(1400);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", clip }, sessionId);
      tiles.push(Buffer.from(shot.data, "base64"));
    }
    const tw = Math.round(clip.width), th = Math.round(clip.height);
    const sheet = await sharp({ create: { width: tw * 4, height: th * 3, channels: 3, background: "#010a18" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % 4) * tw, top: Math.floor(i / 4) * th })))
      .png()
      .toBuffer();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, sheet);
    console.log("wrote", OUT, tw, th);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });

