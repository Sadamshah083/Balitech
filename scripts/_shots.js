/**
 * Screenshots the home page before and after scrolling.
 *
 *   node scripts/_shots.js [url] [--out=tmp] [--w=412] [--h=915]
 *
 * The performance work deferred the scroll ribbon behind a first-interaction
 * gate, so "does it still look right" now has two answers rather than one and
 * both need to be looked at.
 */
const fs = require("node:fs");
const path = require("node:path");
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const OUT = flag("out", "tmp");
const WIDTH = Number(flag("w", 412));
const HEIGHT = Number(flag("h", 915));
const LABEL = flag("label", "home");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = await launch({ port: 9700 + (process.pid % 200) });

  try {
    const cdp = connect(chrome.wsUrl);
    await cdp.ready;

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: WIDTH < 700 },
      sessionId
    );
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);

    const shoot = async (name) => {
      const { data } = await cdp.send(
        "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: false },
        sessionId
      );
      const file = path.resolve(OUT, `${LABEL}-${name}.png`);
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      console.log(`   ${file}`);
    };

    /* Past the intro so the hero itself is what gets captured. */
    await sleep(4000);
    console.log(`\n${URL_ARG}  @ ${WIDTH}x${HEIGHT}\n`);
    await shoot("hero");

    await cdp.send(
      "Runtime.evaluate",
      { expression: `window.scrollTo({ top: 1400, behavior: "instant" })` },
      sessionId
    );
    /* Long enough for the interaction gate, the GSAP fetch, and the reveal. */
    await sleep(5000);
    await shoot("scrolled");

    await cdp.send(
      "Runtime.evaluate",
      {
        expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })`,
      },
      sessionId
    );
    await sleep(3000);
    await shoot("footer");

    cdp.close();
    console.log("");
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
