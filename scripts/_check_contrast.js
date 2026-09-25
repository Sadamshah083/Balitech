/**
 * Measures the real contrast between text and whatever is rendered behind it.
 *
 *   node scripts/_check_contrast.js [url] [width] [--dump=dir]
 *
 * Written for the light ribbon on the home page: it is a bright layer sitting
 * behind copy that used to have flat navy behind it, and eyeballing a
 * screenshot cannot tell you whether a given paragraph still clears WCAG.
 *
 * Reading the CSS cannot answer it either — the background under any given
 * line is the composite of a blend-mode layer, a blurred SVG stroke and a
 * couple of gradients, so the only honest source is the rendered pixels.
 *
 * Method: hide the glyphs (`color: transparent`, so layout and every
 * background layer stay exactly as they were), photograph the page, and
 * compare each line of text against the lightest and darkest background pixel
 * behind it. Judging by the extremes rather than the mean is the point: a mean
 * happily passes a paragraph with one unreadable line where a bright strand
 * crosses it.
 *
 * Two details matter for the result to mean anything:
 *
 *   Line boxes, not element boxes. A ragged headline's element box includes
 *   the empty space to the right of its short lines, and a bright strand
 *   crossing that space is not behind any text. Range.getClientRects() gives
 *   rects tight to each line's inline content.
 *
 *   One capture per viewport, not per line. Screenshots dominate the runtime,
 *   so lines are bucketed by scroll position and every line in a bucket is
 *   measured from the same capture.
 *
 * Pixels are decoded by Chrome rather than in Node — the capture goes back
 * into the page as a data URL, onto a canvas, and out through getImageData.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const URL_ARG = positional[0] || "http://localhost:3200/";
const WIDTH = Number(positional[1] || 1440);
const DUMP = (args.find((a) => a.startsWith("--dump=")) || "").slice(7) || null;
const HEIGHT = 950;
const PORT = 9334;

/* Everything on the page that carries prose. Deliberately includes the muted
   secondary copy, which is the first thing to fail — it starts at a lower
   contrast than the headings do. */
const TEXT_SELECTORS = [
  "h1",
  "h2",
  "h3",
  "h4",
  ".ent-lede",
  ".ent-eyebrow",
  ".ent-card__text",
  ".hero-copy__text",
  ".path-card__text",
  ".why-tile__text",
  ".operations__step-text",
  ".voice-card__quote",
  ".impact-card__text",
  ".culture__text",
  ".closer__text",
  ".home-job-card__location",
].join(",");

/* The sticky header overlaps the top of the viewport at every scroll position,
   so anything under it is measuring the header rather than the page. */
const HEADER_SAFE = 76;

/* AA: 4.5 for body text, 3.0 once type is large or bold enough to count as
   large-scale. Anything at or above 24px, or 18.66px and bold, is large. */
const AA_NORMAL = 4.5;
const AA_LARGE = 3;

const CHROME_CANDIDATES = [
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Edge binary found");
  return found;
}

async function getTargetUrl() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome did not expose its debugging port");
}

/** Minimal CDP client: send(method, params, sessionId) -> Promise<result>. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  return {
    ready,
    close: () => ws.close(),
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId }));
      });
    },
  };
}

/* WCAG relative luminance and contrast ratio. */
function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a, b) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

async function main() {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" +
        fs.mkdtempSync(
          require("node:path").join(require("node:os").tmpdir(), "chrome-contrast-")
        ),
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  chrome.stderr.on("data", () => {});

  const cdp = connect(await getTargetUrl());
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false },
    sessionId
  );
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
  await sleep(6000);

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    if (exceptionDetails) throw new Error(exceptionDetails.text);
    return result.value;
  };

  /* Scroll-triggered sections start at opacity 0, so the page has to be walked
     before anything can be measured. Walking it also brings every lazy image
     into range; waiting for those to decode afterwards is what stops the page
     from growing underneath the measurements. */
  await evaluate(`(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      [...document.images]
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
          setTimeout(r, 4000);
        }))
    );
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));
  })()`);

  const lines = await evaluate(`(() => {
    const out = [];

    /* Every run of text gets wrapped in a bare inline span, and the span is
       what gets measured from here on.

       Neither of the obvious alternatives works. An element's rect covers its
       whole box, including any decorative children — the brushstroke under the
       brand headings is an orange bar inside the h1, and measuring it as
       "background" fails a heading that is really white on navy. A text node's
       rect avoids the bar itself but still reports the height of the line box it
       sits in, which the bar stretches, so the orange is back inside the sample.

       An inline span's rects come from the font metrics of the text it wraps:
       one rect per line fragment, each tight to the glyphs. The wrapper carries
       no styles, so it changes nothing about layout or paint. */
    const wrapped = new WeakSet();
    window.__probeWrap = (el, keyFor) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.nodeValue.trim().length && !wrapped.has(n)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      });
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);

      const spans = [];
      for (const text of nodes) {
        wrapped.add(text);
        const span = document.createElement("span");
        span.setAttribute("data-contrast-run", keyFor());
        text.parentNode.insertBefore(span, text);
        span.appendChild(text);
        spans.push(span);
      }
      return spans;
    };

    /* Where the ink actually is inside a fragment's rect, as an offset from its
       top and a height.

       A fragment's box is the font's content area, which is taller than the
       glyphs and — when line-height is tighter than that area, as it is on the
       display headings — taller than the line box too. It therefore hangs below
       the text into whatever follows, which is how an orange brushstroke under a
       heading ends up inside the sample. Canvas reports the same metrics the
       layout used, so the band can be cut back to the glyphs themselves. */
    const inkCanvas = document.createElement("canvas").getContext("2d");
    window.__probeInk = (span, s) => {
      const text = span.textContent || "";
      inkCanvas.font = [s.fontStyle, s.fontWeight, s.fontSize, s.fontFamily]
        .filter(Boolean)
        .join(" ");
      const m = inkCanvas.measureText(text);
      const baseline = m.fontBoundingBoxAscent;
      if (!baseline) return { top: 0, height: span.getBoundingClientRect().height };
      const top = baseline - m.actualBoundingBoxAscent;
      const bottom = baseline + m.actualBoundingBoxDescent;
      return { top, height: Math.max(4, bottom - top) };
    };

    /* Chrome resolves color-mix() to color(srgb 0.65 0.71 0.8) rather than to
       rgb(), and those 0–1 components read as near-black if you parse the
       numbers out yourself. Painting the colour and reading the pixel back
       gives a real triple whatever syntax it was written in. */
    const swatch = document.createElement("canvas");
    swatch.width = swatch.height = 1;
    const swatchCtx = swatch.getContext("2d");
    const toRgb = (css) => {
      swatchCtx.clearRect(0, 0, 1, 1);
      swatchCtx.fillStyle = "#000";
      swatchCtx.fillStyle = css;
      swatchCtx.fillRect(0, 0, 1, 1);
      const d = swatchCtx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };

    let tag = 0;
    for (const el of document.querySelectorAll(${JSON.stringify(TEXT_SELECTORS)})) {
      if (el.textContent.trim().length < 3) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none") continue;
      if (Number(s.opacity) < 0.5) continue;
      /* Screen-reader-only copy is clipped away rather than hidden, so it still
         reports line rects — and nobody can read it to be bothered by them. */
      if (el.closest(".sr-only")) continue;

      const size = parseFloat(s.fontSize);
      const weight = Number(s.fontWeight) || 400;
      const label =
        el.tagName.toLowerCase() +
        "." + (el.className || "").toString().split(" ")[0];

      /* Each run keeps its own id so the rect can be read again at capture
         time. Anything that reflows between now and then — a late image, a
         carousel advancing — would otherwise leave the sample pointing at
         whatever moved into that position instead of the text. */
      for (const span of window.__probeWrap(el, () => String(tag++))) {
        const key = span.getAttribute("data-contrast-run");
        const ink = window.__probeInk(span, s);
        const rects = span.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (r.width < 10 || r.height < 6) continue;
          out.push({
            label,
            text: (span.textContent || "").trim().slice(0, 40),
            color: toRgb(s.color),
            size,
            large: size >= 24 || (size >= 18.66 && weight >= 700),
            key,
            rectIndex: i,
            inkTop: ink.top,
            inkHeight: ink.height,
            pageY: r.top + window.scrollY,
          });
        }
      }
    }
    return out;
  })()`);

  /* Glyphs off, everything else untouched — the point is to photograph exactly
     the background each line of text sits on. */
  await evaluate(`(() => {
    const style = document.createElement("style");
    style.id = "contrast-probe";
    /* The dev-server badge is a black pill with white text that parks itself
       over the bottom-left of the viewport, which is the footer by the time the
       probe gets there. It is not part of the page. */
    style.textContent =
      "*, *::before, *::after { color: transparent !important; text-shadow: none !important; -webkit-text-fill-color: transparent !important; }" +
      "nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }";
    document.head.appendChild(style);

    /* Gradient-filled headings clip a background to their glyph shapes, so
       hiding the fill colour leaves the gradient painting the letters. Without
       this the probe photographs a heading's own text as the background behind
       it and reports the brand orange as a contrast failure. */
    for (const el of document.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      if (s.webkitBackgroundClip === "text" || s.backgroundClip === "text") {
        el.style.setProperty("background-image", "none", "important");
      }
    }
  })()`);
  await sleep(500);

  /* One capture per bucket, each holding the lines that fit in a single
     viewport clear of the header. */
  const bucketHeight = HEIGHT - HEADER_SAFE - 40;
  const buckets = new Map();
  for (const line of lines) {
    const key = Math.floor(line.pageY / bucketHeight);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(line);
  }

  const failures = [];
  let measured = 0;
  let worst = { ratio: Infinity };

  for (const [key, group] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const scrollTo = Math.max(0, key * bucketHeight - HEADER_SAFE);
    await evaluate(`window.scrollTo(0, ${scrollTo})`);
    await sleep(120);

    const shot = await cdp.send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: false },
      sessionId
    );

    const results = await evaluate(`(async () => {
      const img = new Image();
      img.src = "data:image/png;base64,${shot.data}";
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const lum = (r, g, b) => {
        const ch = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
      };

      return ${JSON.stringify(group)}.map((line, index) => {
        /* Read where the line is now, in the same frame that was photographed,
           rather than where it was when the run started. */
        const el = document.querySelector('[data-contrast-run="' + line.key + '"]');
        if (!el) return { index, skipped: true };
        const r = el.getClientRects()[line.rectIndex];
        if (!r) return { index, skipped: true };

        const y = Math.round(r.top + line.inkTop);
        const x = Math.round(r.left);
        const w = Math.round(r.width);
        const h = Math.round(line.inkHeight);
        if (y < ${HEADER_SAFE} || y + h > c.height || x < 0 || x + w > c.width) {
          return { index, skipped: true };
        }
        const { data } = ctx.getImageData(x, y, w, h);
        let min = null, max = null, minL = 2, maxL = -1;
        /* Every 3rd pixel each way: 9x fewer samples, and a strand wide enough
           to hurt legibility cannot hide between them. */
        for (let py = 0; py < h; py += 3) {
          for (let px = 0; px < w; px += 3) {
            const i = (py * w + px) * 4;
            const l = lum(data[i], data[i + 1], data[i + 2]);
            if (l < minL) { minL = l; min = [data[i], data[i + 1], data[i + 2]]; }
            if (l > maxL) { maxL = l; max = [data[i], data[i + 1], data[i + 2]]; }
          }
        }
        return { index, min, max, minL, maxL };
      });
    })()`);

    for (const result of results) {
      if (result.skipped || !result.max) continue;
      const line = group[result.index];
      measured++;

      const textL = luminance(line.color);
      const worstRatio = Math.min(
        ratio(textL, result.minL),
        ratio(textL, result.maxL)
      );
      const need = line.large ? AA_LARGE : AA_NORMAL;

      if (worstRatio < worst.ratio) worst = { ratio: worstRatio, line, need };
      if (worstRatio < need) failures.push({ line, worstRatio, need, result });
    }
  }

  /* Writes out the exact strip of pixels a failure was judged on. Reading a
     ratio tells you a line is dark-on-dark somewhere; only the crop tells you
     whether the culprit is really behind the type or whether the rect has
     picked up something next to it. */
  if (DUMP && failures.length) {
    fs.mkdirSync(DUMP, { recursive: true });
    for (let i = 0; i < failures.length; i++) {
      const { line } = failures[i];
      await evaluate(`window.scrollTo(0, ${Math.max(0, line.pageY - 300)})`);
      await sleep(200);
      const shot = await cdp.send(
        "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: false },
        sessionId
      );
      const crop = await evaluate(`(async () => {
        const el = document.querySelector('[data-contrast-run="${line.key}"]');
        const r = el && el.getClientRects()[${line.rectIndex}];
        if (!r) return null;
        const img = new Image();
        img.src = "data:image/png;base64,${shot.data}";
        await img.decode();
        const pad = 6;
        const c = document.createElement("canvas");
        c.width = Math.round(r.width) + pad * 2;
        c.height = Math.round(${line.inkHeight}) + pad * 2;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, Math.round(r.left) - pad, Math.round(r.top + ${line.inkTop}) - pad, c.width, c.height, 0, 0, c.width, c.height);
        return c.toDataURL("image/png").slice("data:image/png;base64,".length);
      })()`);
      if (!crop) continue;
      const name = `${String(i).padStart(2, "0")}-${line.label.replace(/[^a-z0-9]+/gi, "-")}.png`;
      fs.writeFileSync(`${DUMP}/${name}`, Buffer.from(crop, "base64"));
      console.log(`  dumped ${DUMP}/${name}`);
    }
  }

  await evaluate(`document.getElementById("contrast-probe")?.remove()`);

  console.log(`\ncontrast probe — ${URL_ARG} @ ${WIDTH}px`);
  console.log(`measured ${measured} of ${lines.length} text lines\n`);

  if (failures.length === 0) {
    console.log("PASS — every measured line clears WCAG AA");
    if (worst.line) {
      console.log(
        `  tightest: ${worst.ratio.toFixed(2)}:1 (needs ${worst.need}) ` +
          `${worst.line.label} "${worst.line.text}"`
      );
    }
  } else {
    /* Worst first: if the ribbon needs toning down, this is the line that says
       by how much. */
    failures.sort((a, b) => a.worstRatio - b.worstRatio);
    console.log(`FAIL — ${failures.length} line(s) below AA\n`);
    for (const f of failures.slice(0, 20)) {
      console.log(
        `  ${f.worstRatio.toFixed(2)}:1 (needs ${f.need})  ` +
          `${f.line.size.toFixed(0)}px  ${f.line.label}\n` +
          `      "${f.line.text}"  at page y=${Math.round(f.line.pageY)}\n` +
          `      bg range rgb(${f.result.min}) .. rgb(${f.result.max})`
      );
    }
  }

  cdp.close();
  chrome.kill();
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
