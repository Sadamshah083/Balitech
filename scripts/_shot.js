/**
 * Screenshots a page at a given viewport.
 *
 *   node scripts/_shot.js url [--width=412] [--height=900] [--scroll=0] [--out=tmp/shot.png]
 */
const fs = require("fs");
const path = require("path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3300/";
const num = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const WIDTH = num("width", 412);
const HEIGHT = num("height", 900);
const SCROLL = num("scroll", 0);
const WAIT = num("wait", 4000);
const OUT = (args.find((a) => a.startsWith("--out=")) || "--out=tmp/shot.png").slice(6);

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: WIDTH < 900 },
      sessionId
    );
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(WAIT);

    if (SCROLL) {
      await cdp.send(
        "Runtime.evaluate",
        { expression: `window.scrollTo(0, ${SCROLL}); "ok"`, returnByValue: true },
        sessionId
      );
      await sleep(1200);
    }

    const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.from(shot.data, "base64"));
    console.log(`wrote ${OUT}`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
