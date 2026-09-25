/**
 * Lists every image the page actually loads, with the size it was decoded at
 * against the size it is drawn at.
 *
 *   node scripts/_img_audit.js [url] [--mobile]
 *
 * The first scroll down the page is far more expensive than any later one, and
 * decoding dominates it: a photo costs width x height x 4 bytes to decode no
 * matter how small the box it ends up in. An image delivered at four times the
 * pixels it is displayed at costs sixteen times the decode, and that lands as a
 * long frame exactly when the section scrolls into view.
 *
 * "waste" is the ratio of decoded pixels to displayed pixels. Anything much
 * above 1 is decode being paid for detail that cannot be seen — at a device
 * pixel ratio of 2 the honest target is 2, since the layout size is in CSS
 * pixels and a retina screen genuinely draws twice as many.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const MOBILE = args.includes("--mobile");
const DPR = MOBILE ? 2 : 1;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    /* Transfer size per URL, so the report can show bytes as well as pixels. */
    const bytes = new Map();
    const byUrl = new Map();
    cdp.on("Network.requestWillBeSent", (p) => byUrl.set(p.requestId, p.request.url));
    cdp.on("Network.loadingFinished", (p) => bytes.set(p.requestId, p.encodedDataLength));

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      MOBILE
        ? { width: 412, height: 823, deviceScaleFactor: 2, mobile: true }
        : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const evaluate = async (expression) => {
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise: true },
        sessionId
      );
      return result.value;
    };

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(MOBILE ? 9000 : 6000);

    /* Walk the whole page so lazy images below the fold are fetched too. */
    await evaluate(`
      (async () => {
        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 260));
        }
        window.scrollTo(0, 0);
        return "ok";
      })()
    `);
    await sleep(2500);

    const imgs = JSON.parse(
      await evaluate(`
        JSON.stringify(
          Array.from(document.images)
            .filter((i) => i.currentSrc && i.naturalWidth)
            .map((i) => {
              const r = i.getBoundingClientRect();
              return {
                src: i.currentSrc,
                nw: i.naturalWidth,
                nh: i.naturalHeight,
                dw: Math.round(r.width),
                dh: Math.round(r.height),
                loading: i.loading,
                decoding: i.decoding,
                fetchPriority: i.fetchPriority,
              };
            })
        )
      `)
    );

    const size = new Map();
    for (const [reqId, url] of byUrl) {
      if (bytes.has(reqId)) size.set(url, bytes.get(reqId));
    }

    const rows = imgs
      .map((i) => {
        const shown = Math.max(1, i.dw * i.dh);
        return { ...i, waste: (i.nw * i.nh) / shown, kb: (size.get(i.src) || 0) / 1024 };
      })
      .sort((a, b) => b.waste - a.waste);

    const totalKb = rows.reduce((s, r) => s + r.kb, 0);
    const totalMp = rows.reduce((s, r) => s + (r.nw * r.nh) / 1e6, 0);

    console.log(`\n${MOBILE ? "MOBILE" : "DESKTOP"}  ${URL_ARG}`);
    console.log(`${rows.length} images, ${totalKb.toFixed(0)} KB, ${totalMp.toFixed(1)} megapixels to decode`);
    console.log(`(a device pixel ratio of ${DPR} makes ${DPR * DPR} the honest "waste" target)\n`);
    console.log(`   decoded      displayed    waste     KB   lazy  decoding  file`);
    console.log(`   ─────────────────────────────────────────────────────────────`);
    for (const r of rows) {
      const name = r.src.split("/").pop().split("?")[0].slice(0, 34);
      console.log(
        `   ${String(r.nw + "x" + r.nh).padEnd(12)} ${String(r.dw + "x" + r.dh).padEnd(11)}` +
          `${r.waste.toFixed(1).padStart(6)}x ${r.kb.toFixed(0).padStart(6)}  ` +
          `${(r.loading || "-").padEnd(6)}${(r.decoding || "-").padEnd(9)} ${name}`
      );
    }

    const over = rows.filter((r) => r.waste > DPR * DPR * 1.6);
    const wastedMp = over.reduce(
      (s, r) => s + (r.nw * r.nh - r.dw * r.dh * DPR * DPR) / 1e6,
      0
    );
    console.log(
      `\n   ${over.length} images decode more than ${(DPR * DPR * 1.6).toFixed(1)}x the pixels they show` +
        `\n   ${wastedMp.toFixed(1)} megapixels of avoidable decode ` +
        `(~${(wastedMp * 4).toFixed(0)} MB of bitmap)\n`
    );
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
