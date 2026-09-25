/**
 * Measures whether the intro wipe's mask clips the wordmark's glyphs.
 *
 *   node scripts/_intro_w_diff.js [url] [--width=1280]
 *
 * A mask with no-repeat and mask-size 100% covers only its own element's box,
 * so any glyph ink outside that box — a script capital's leading swash, for
 * instance — is masked away. That is invisible by eye at small sizes, so this
 * captures the same region with the mask on and off and compares the leftmost
 * lit pixel of each. Decoding happens in the page, where a canvas is available.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org";
const WIDTH = Number((args.find((a) => a.startsWith("--width=")) || "--width=1280").slice(8));

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const evaluate = async (expression, sessionId) => {
    const { result, exceptionDetails } = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    if (exceptionDetails) throw new Error(exceptionDetails.text || "evaluate failed");
    return result.value;
  };

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: WIDTH, height: 760, deviceScaleFactor: 2, mobile: false },
      sessionId
    );
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(3800);

    const box = await evaluate(
      `(() => {
        const intro = document.querySelector(".hero-intro");
        const ink = document.querySelector(".hero-intro__script-ink");
        intro.classList.remove("is-leaving");
        intro.style.opacity = "1";
        intro.style.visibility = "visible";
        intro.style.animation = "none";
        intro.style.setProperty("--intro-progress", "1");
        /* The glow would spread ink outside the box and confuse the comparison. */
        document.querySelector(".hero-intro__script").style.filter = "none";
        const r = ink.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })()`,
      sessionId
    );

    const PAD = 220;
    const left = Math.max(0, box.x - PAD);
    const clip = {
      x: left,
      y: Math.max(0, box.y - 30),
      width: Math.min(WIDTH - left, box.w + PAD * 2),
      height: box.h + 60,
      scale: 2,
    };

    const shot = async () => {
      await sleep(350);
      const r = await cdp.send("Page.captureScreenshot", { format: "png", clip }, sessionId);
      return r.data;
    };

    const masked = await shot();
    await evaluate(
      `(() => {
        const ink = document.querySelector(".hero-intro__script-ink");
        ink.style.webkitMaskImage = "none";
        ink.style.maskImage = "none";
      })()`,
      sessionId
    );
    const nomask = await shot();

    const report = await evaluate(
      `(async () => {
        const load = (b64) => new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = "data:image/png;base64," + b64;
        });

        /* Leftmost column containing ink, plus the total lit pixel count. */
        const scan = (img) => {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, c.width, c.height);
          let leftmost = -1;
          let lit = 0;
          for (let x = 0; x < c.width; x++) {
            for (let y = 0; y < c.height; y++) {
              const i = (y * c.width + x) * 4;
              /* The backdrop is near-black navy; glyphs are near-white. */
              const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
              if (l > 120) {
                lit++;
                if (leftmost === -1) leftmost = x;
              }
            }
          }
          return { leftmost, lit, width: c.width, height: c.height };
        };

        /* Where the two differ, so the clipped side can be identified. */
        const diff = async () => {
          const [ia, ib] = [await load(${JSON.stringify(masked)}), await load(${JSON.stringify(nomask)})];
          const c = document.createElement("canvas");
          c.width = ia.width;
          c.height = ia.height;
          const ctx = c.getContext("2d");
          ctx.drawImage(ia, 0, 0);
          const da = ctx.getImageData(0, 0, c.width, c.height).data;
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(ib, 0, 0);
          const db = ctx.getImageData(0, 0, c.width, c.height).data;

          let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, n = 0;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const i = (y * c.width + x) * 4;
              if (Math.abs(da[i] - db[i]) > 40) {
                n++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          return n ? { n, minX, maxX, minY, maxY, w: c.width, h: c.height } : null;
        };

        const a = scan(await load(${JSON.stringify(masked)}));
        const b = scan(await load(${JSON.stringify(nomask)}));
        return { masked: a, nomask: b, diff: await diff() };
      })()`,
      sessionId
    );

    const { masked: m, nomask: n } = report;
    /* deviceScaleFactor 2, so image pixels are half a CSS pixel each. */
    const cssClipped = (m.leftmost - n.leftmost) / 2;

    console.log(`\nviewport ${WIDTH}px   font ink box ${box.w.toFixed(0)}px wide\n`);
    console.log(`   with mask     leftmost ink at image x=${m.leftmost}, ${m.lit} lit px`);
    console.log(`   without mask  leftmost ink at image x=${n.leftmost}, ${n.lit} lit px`);
    console.log(`\n   glyph ink removed by the mask: ${(n.lit - m.lit).toLocaleString()} px`);
    console.log(
      `   left edge of the W cut off:    ${cssClipped > 0 ? cssClipped.toFixed(1) + "px (CSS)" : "none"}`
    );

    if (report.diff) {
      const d = report.diff;
      console.log(`\n   clipped region (image px, frame is ${d.w}x${d.h}):`);
      console.log(`      x ${d.minX}..${d.maxX}   y ${d.minY}..${d.maxY}`);
      const sides = [];
      if (d.minX <= 2) sides.push("left edge");
      if (d.maxX >= d.w - 3) sides.push("right edge");
      if (d.minY <= 2) sides.push("top edge");
      if (d.maxY >= d.h - 3) sides.push("bottom edge");
      console.log(
        `      touches: ${sides.length ? sides.join(", ") : "interior only (soft trailing edge of the wipe)"}\n`
      );
    } else {
      console.log("\n   no pixel difference\n");
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
