/**
 * Reports the real contrast ratio of a selector against what is painted behind
 * it, and solves for the lowest foreground mix that clears WCAG.
 *
 *   node scripts/_contrast.js [url] [selector]
 *
 * Guessing at an alpha and re-running Lighthouse is a slow loop; this composites
 * the colour the same way the browser does and reports the answer directly.
 */
const { launch, connect, sleep } = require("./_chrome");

const URL = process.argv[2] || "https://balitech.org";
const SELECTOR = process.argv[3] || ".framework__aside span";

const PROBE = `JSON.stringify((() => {
  /* Chrome resolves color-mix() to "color(srgb r g b / a)" with 0-1 channels,
     not to rgba(), so both spellings have to be understood. */
  const parse = (c) => {
    const str = String(c);
    const srgb = str.match(/color\\(srgb\\s+([^)]+)\\)/);
    if (srgb) {
      const p = srgb[1].split(/[\\s/]+/).filter(Boolean).map(parseFloat);
      return {
        r: p[0] * 255,
        g: p[1] * 255,
        b: p[2] * 255,
        a: p.length > 3 && !Number.isNaN(p[3]) ? p[3] : 1,
      };
    }
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\/]/).map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !Number.isNaN(p[3]) ? p[3] : 1 };
  };

  /* Walks up for the first non-transparent background, compositing any
     semi-transparent layers it passes on the way. */
  const backdropOf = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a === 1) break;
      }
      node = node.parentElement;
    }
    if (!layers.length) layers.push({ r: 255, g: 255, b: 255, a: 1 });
    let out = layers[layers.length - 1];
    for (let i = layers.length - 2; i >= 0; i -= 1) {
      const top = layers[i];
      out = {
        r: top.r * top.a + out.r * (1 - top.a),
        g: top.g * top.a + out.g * (1 - top.a),
        b: top.b * top.a + out.b * (1 - top.a),
        a: 1,
      };
    }
    return out;
  };

  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(${JSON.stringify(SELECTOR)})) {
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = backdropOf(el);
    const composited = over(fg, bg);
    const px = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    /* WCAG "large text" is 18.66px+ bold or 24px+. */
    const large = px >= 24 || (px >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;

    /* Smallest alpha on the declared colour that clears the requirement. */
    let minAlpha = null;
    for (let a = fg.a; a <= 1.0001; a += 0.01) {
      if (ratio(over({ ...fg, a }, bg), bg) >= need) { minAlpha = a; break; }
    }

    const key = cs.color + "|" + Math.round(bg.r) + "," + Math.round(bg.g) + "," + Math.round(bg.b) + "|" + px + "|" + weight;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      text: (el.textContent || "").trim().slice(0, 24),
      color: cs.color,
      backdrop: "rgb(" + [bg.r, bg.g, bg.b].map((v) => Math.round(v)).join(", ") + ")",
      composited: "rgb(" + [composited.r, composited.g, composited.b].map((v) => Math.round(v)).join(", ") + ")",
      fontPx: px,
      weight,
      large,
      need,
      ratio: Math.round(ratio(composited, bg) * 100) / 100,
      declaredAlpha: Math.round(fg.a * 100),
      minAlphaNeeded: minAlpha === null ? null : Math.round(minAlpha * 100),
    });
  }
  return { count: document.querySelectorAll(${JSON.stringify(SELECTOR)}).length, variants: out };
})())`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    /* Wide enough that xl-only decorations are actually rendered. */
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    await cdp.send("Page.navigate", { url: URL }, sessionId);
    await sleep(5500);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );
    const d = JSON.parse(result.value);

    console.log(`\n${SELECTOR}   (${d.count} node${d.count === 1 ? "" : "s"}, ${d.variants.length} distinct)\n`);
    for (const v of d.variants) {
      const verdict = v.ratio >= v.need ? "PASS" : "FAIL";
      console.log(`  "${v.text}"`);
      console.log(`     ${v.fontPx}px / weight ${v.weight}  ->  needs ${v.need}:1 (${v.large ? "large" : "normal"} text)`);
      console.log(`     colour     ${v.color}   at ${v.declaredAlpha}% alpha`);
      console.log(`     backdrop   ${v.backdrop}`);
      console.log(`     painted    ${v.composited}`);
      console.log(`     ratio      ${v.ratio}:1   ${verdict}`);
      if (v.ratio < v.need) {
        console.log(`     fix        raise alpha to ${v.minAlphaNeeded}% (or enlarge/bolden the text)`);
      }
      console.log("");
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
