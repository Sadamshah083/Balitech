/** Local debugging aid: captures each slide of the hero centre slider into one contact sheet. */
const fs = require("fs");
const sharp = require("sharp");
const { launch, connect, sleep } = require("./_chrome");
(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/" }, sessionId);
    await sleep(9000);
    const ev = async (e) => (await cdp.send("Runtime.evaluate", { expression: e, returnByValue: true }, sessionId)).result.value;
    const r = JSON.parse(await ev(`(() => { const r = document.querySelector('.hero-stage').getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`));
    const clip = { x: r.x - 20, y: r.y - 20, width: r.w + 40, height: r.h + 140, scale: 1 };
    const tiles = [];
    for (let i = 0; i < 16; i++) {
      await ev(`(() => { const c=document.querySelector('.hero-center'); c.dispatchEvent(new MouseEvent('mouseenter')); ${i === 0 ? "" : "c.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));"} return 1; })()`);
      await sleep(1500);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", clip }, sessionId);
      tiles.push(Buffer.from(shot.data, "base64"));
    }
    const tw = Math.round(clip.width), th = Math.round(clip.height);
    const sheet = await sharp({ create: { width: tw * 4, height: th * 4, channels: 3, background: "#010a18" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % 4) * tw, top: Math.floor(i / 4) * th })))
      .png().toBuffer();
    fs.writeFileSync("tmp/center-sheet.png", sheet);
    console.log("wrote tmp/center-sheet.png", tw, th);
  } finally { cdp.close(); chrome.stop(); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });




