/** Local debugging aid: screenshots the hero book closed, then after the page turn. */
const fs = require("fs");
const path = require("path");
const { launch, connect, sleep } = require("./_chrome");

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const OUT = process.argv[4] || "tmp/book";

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sessionId);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/" }, sessionId);
    await sleep(9000);
    const ev = async (expression) =>
      (await cdp.send("Runtime.evaluate", { expression, returnByValue: true }, sessionId)).result.value;
    const shot = async (name) => {
      const r = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      fs.mkdirSync(path.dirname(name), { recursive: true });
      fs.writeFileSync(name, Buffer.from(r.data, "base64"));
      console.log("wrote", name);
    };
    await shot(`${OUT}-closed.png`);
    await ev(`document.querySelector('.hero-flip__btn--next').click(); 'ok'`);
    await sleep(600);
    await shot(`${OUT}-mid.png`);
    await sleep(1900);
    await shot(`${OUT}-open.png`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
