/**
 * Whether the intro wordmark is actually drawn in the script face.
 *
 *   node scripts/_font_check.js [url]
 *
 * The face is subset to the exact characters of HERO_INTRO_WORDMARK, so a broken
 * subset or a missing glyph fails silently: the text still renders, just in the
 * Arial fallback, which is easy to miss and undoes the whole intro.
 */
const { launch, connect, sleep } = require("./_chrome");

const URL_ARG = process.argv[2] || "http://127.0.0.1:3300/";

const PROBE = `JSON.stringify((() => { try {
  const ink = document.querySelector(".hero-intro__script-ink");
  const family = ink ? getComputedStyle(ink).fontFamily : null;
  const varValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-script").trim();

  /* document.fonts reports every face the page declared and whether the browser
     actually fetched and parsed it. */
  const faces = Array.from(document.fonts).map((f) => ({
    family: f.family,
    status: f.status,
  }));

  /* Same string measured in the resolved stack and in the fallback alone. A
     script face is far narrower per character than Arial, so if these two come
     out equal the real face is not being used. */
  const measure = (font) => {
    const c = document.createElement("canvas").getContext("2d");
    c.font = font;
    return Math.round(c.measureText("Welcome to Bali Tech").width);
  };

  const size = ink ? getComputedStyle(ink).fontSize : "80px";
  return {
    inkPresent: Boolean(ink),
    fontFamily: family,
    scriptVar: varValue,
    fontSize: size,
    faces,
    widthResolved: ink ? measure(size + " " + family) : null,
    widthFallback: measure(size + " Arial"),
  };
} catch (e) { return { error: String(e && e.message || e) }; } })())`;

(async () => {
  const chrome = await launch({ port: 9700 + (process.pid % 200) });

  try {
    const cdp = connect(chrome.wsUrl);
    await cdp.ready;

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);

    const fontRequests = [];
    cdp.on("Network.responseReceived", (p) => {
      if (/\.woff2/.test(p.response?.url || "")) {
        fontRequests.push({
          status: p.response.status,
          url: p.response.url.split("/").pop(),
        });
      }
    });

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(3500);

    const evaluated = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );

    if (evaluated.exceptionDetails) {
      cdp.close();
      console.error(
        "\nprobe threw: " +
          (evaluated.exceptionDetails.exception?.description ||
            evaluated.exceptionDetails.text)
      );
      process.exitCode = 1;
      return;
    }

    const r = JSON.parse(evaluated.result.value);
    cdp.close();

    if (r.error) {
      console.error(`\nprobe error: ${r.error}\n`);
      process.exitCode = 1;
      return;
    }

    console.log(`\n${URL_ARG}\n`);
    console.log(`   ink element present : ${r.inkPresent}`);
    console.log(`   --font-script       : ${r.scriptVar || "(empty)"}`);
    console.log(`   computed fontFamily : ${r.fontFamily}`);
    console.log(`   font-size           : ${r.fontSize}`);
    console.log(`\n   wordmark width in resolved stack : ${r.widthResolved}px`);
    console.log(`   wordmark width in Arial fallback : ${r.widthFallback}px`);

    console.log(`\n   woff2 responses:`);
    for (const f of fontRequests) console.log(`      ${f.status}  ${f.url}`);

    console.log(`\n   declared faces:`);
    for (const f of r.faces) console.log(`      ${f.status.padEnd(8)} ${f.family}`);

    /* A script face is dramatically narrower than Arial at the same size, so
       equal widths mean the fallback is what is on screen. */
    const usingScript =
      r.widthResolved !== null && Math.abs(r.widthResolved - r.widthFallback) > 8;
    console.log(
      `\n${usingScript ? "PASS" : "FAIL"}: intro wordmark ${usingScript ? "is" : "is NOT"} drawn in the script face\n`
    );
    process.exitCode = usingScript ? 0 : 1;
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
