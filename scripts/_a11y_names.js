/**
 * Lists interactive elements that expose no accessible name.
 *
 *   node scripts/_a11y_names.js [url]
 *
 * Lighthouse reports the count but the offending node is easy to lose among
 * extension-injected controls, so this walks the page's own DOM and prints an
 * identifying snippet for each unnamed button, link, and input.
 */
const { launch, connect, sleep } = require("./_chrome");

const URL = process.argv[2] || "https://balitech.org";

const PROBE = `JSON.stringify((() => {
  /* Mirrors how the accessibility tree resolves a name, in priority order. */
  const nameOf = (el) => {
    const labelledby = el.getAttribute("aria-labelledby");
    if (labelledby) {
      const txt = labelledby
        .split(/\\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .join(" ")
        .trim();
      if (txt) return txt;
    }
    const aria = el.getAttribute("aria-label");
    if (aria && aria.trim()) return aria.trim();
    if (el.title && el.title.trim()) return el.title.trim();
    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
      if (el.labels && el.labels.length) {
        const t = [...el.labels].map((l) => l.textContent.trim()).join(" ").trim();
        if (t) return t;
      }
      if (el.getAttribute("placeholder")) return "(placeholder only)";
    }
    /* Text content, but images inside contribute only through their alt. */
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[aria-hidden='true']").forEach((n) => n.remove());
    let txt = (clone.textContent || "").replace(/\\s+/g, " ").trim();
    if (txt) return txt;
    const img = el.querySelector("img[alt]:not([alt=''])");
    if (img) return "(img alt) " + img.getAttribute("alt");
    const svgTitle = el.querySelector("svg > title");
    if (svgTitle && svgTitle.textContent.trim()) return svgTitle.textContent.trim();
    return "";
  };

  const describe = (el) => {
    const attrs = [...el.attributes]
      .filter((a) => ["class", "id", "type", "href", "data-testid", "aria-hidden"].includes(a.name))
      .map((a) => a.name + '="' + String(a.value).slice(0, 90) + '"')
      .join(" ");
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      attrs,
      html: el.outerHTML.replace(/\\s+/g, " ").slice(0, 190),
      visible: r.width > 0 && r.height > 0,
      rect: Math.round(r.width) + "x" + Math.round(r.height) + " at " + Math.round(r.x) + "," + Math.round(r.y),
      hidden: el.getAttribute("aria-hidden") === "true",
      inert: el.closest("[inert]") !== null,
    };
  };

  const sel = "button, a[href], input:not([type='hidden']), select, textarea, [role='button'], [role='link'], summary";
  const bad = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!nameOf(el)) bad.push(describe(el));
  }

  return {
    url: location.href,
    totalInteractive: document.querySelectorAll(sel).length,
    unnamed: bad,
  };
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
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    await cdp.send("Page.navigate", { url: URL }, sessionId);
    /* Past the hero intro so late-mounted controls are present. */
    await sleep(5000);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );
    const d = JSON.parse(result.value);

    console.log(`\n${d.url}`);
    console.log(`interactive elements: ${d.totalInteractive}`);
    console.log(`without an accessible name: ${d.unnamed.length}\n`);

    d.unnamed.forEach((b, i) => {
      console.log(`[${i + 1}] <${b.tag}>  ${b.visible ? "VISIBLE " + b.rect : "not rendered"}${b.hidden ? "  aria-hidden" : ""}${b.inert ? "  inert" : ""}`);
      console.log(`    ${b.html}\n`);
    });

    if (!d.unnamed.length) console.log("all interactive elements expose a name");
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
