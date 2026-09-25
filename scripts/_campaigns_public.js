/**
 * Reports which campaigns a real browser ends up showing on a page.
 *
 *   node scripts/_campaigns_public.js [url]
 *
 * The carousel ships a static fallback in the prerendered HTML and replaces it
 * with the live list after hydration, so fetching the HTML tells you nothing
 * about what a visitor sees. This waits for hydration and reads the DOM.
 */
const { launch, connect, sleep } = require("./_chrome");

const URL = process.argv[2] || "https://balitech.org";

const PROBE = `JSON.stringify((() => {
  const titles = (sel) =>
    [...document.querySelectorAll(sel)]
      .map((el) => (el.textContent || "").replace(/\\s+/g, " ").trim())
      .filter(Boolean);

  /* Card titles across the campaign/careers rails, whatever they are called. */
  const found = new Set();
  const selectors = [".home-job-card__title", ".campaigns-carousel__card h3"];
  for (const s of selectors) for (const t of titles(s)) found.add(t);

  const bodyText = document.body.innerText;
  return {
    cardTitles: [...found],
    mentionsDialer: /\\bDialer\\b/.test(bodyText),
    mentionsQaExecutive: /QA executive/i.test(bodyText),
    apiCampaignCount: window.__campaignProbe ?? null,
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
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const apiCalls = [];
    cdp.on("Network.responseReceived", (p) => {
      if (p.response?.url?.includes("/api/campaigns")) {
        apiCalls.push(`${p.response.status} ${p.response.url}`);
      }
    });

    await cdp.send("Page.navigate", { url: URL }, sessionId);
    /* Past the intro overlay and the deferred fetch. */
    await sleep(9000);

    /* Scroll through so lazily-mounted rails actually render. */
    await cdp.send(
      "Runtime.evaluate",
      { expression: `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`, awaitPromise: true },
      sessionId
    );
    await sleep(2500);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );
    const d = JSON.parse(result.value);

    console.log(`\n${URL}\n`);
    console.log(`API requests seen: ${apiCalls.length ? apiCalls.join(", ") : "none"}`);
    console.log(`\ncard titles rendered (${d.cardTitles.length}):`);
    for (const t of d.cardTitles) console.log(`   ${t}`);
    console.log(`\n"Dialer" anywhere in visible text:       ${d.mentionsDialer ? "YES" : "no"}`);
    console.log(`"QA executive" anywhere in visible text: ${d.mentionsQaExecutive ? "YES" : "no"}\n`);
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
