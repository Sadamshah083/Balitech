/**
 * Checks that links still behave after prefetching was taken off the scroll
 * path — that hovering a card warms its route, and that clicking one (or a
 * footer link, which is never prefetched) still navigates.
 *
 *   node scripts/_nav_check.js [url]
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith("--")) || "http://localhost:3210").replace(/\/$/, "");

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`   ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId
    );

    const prefetched = [];
    cdp.on("Network.requestWillBeSent", (p) => {
      const h = p.request?.headers || {};
      const named = (n) => Object.entries(h).find(([k]) => k.toLowerCase() === n)?.[1];
      if (named("next-router-prefetch") || named("rsc")) {
        try {
          prefetched.push(new URL(p.request.url).pathname);
        } catch {
          /* ignore */
        }
      }
    });

    const evaluate = async (expression) => {
      const res = await cdp.send(
        "Runtime.evaluate",
        { expression, returnByValue: true, awaitPromise: true },
        sessionId
      );
      return res.result?.value;
    };

    console.log(`\nNAVIGATION  ${BASE}\n`);

    await cdp.send("Page.navigate", { url: `${BASE}/` }, sessionId);
    await sleep(6000);

    // The rail is below the intro, so bring it into view the way a reader would.
    await evaluate(`document.querySelector(".home-job-card")?.scrollIntoView({ block: "center" }); true`);
    await sleep(1200);

    const before = prefetched.length;
    check(before === 0, "nothing prefetched just by scrolling to the rail", `saw ${before}`);

    // Hover the first job card: IntentLink should arm and warm /join-us.
    const hovered = await evaluate(`(() => {
      const card = document.querySelector(".home-job-card");
      if (!card) return false;
      const r = card.getBoundingClientRect();
      card.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: r.x + 10, clientY: r.y + 10 }));
      card.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false, clientX: r.x + 10, clientY: r.y + 10 }));
      return true;
    })()`);
    check(Boolean(hovered), "found a job card to hover");
    await sleep(2500);

    const warmed = prefetched.filter((p) => p.includes("join-us")).length;
    check(warmed > 0, "hovering a job card warms /join-us", `${warmed} prefetch(es)`);

    // And it still navigates.
    await evaluate(`document.querySelector(".home-job-card").click(); true`);
    await sleep(3500);
    const landed = await evaluate(`location.pathname`);
    check(String(landed).startsWith("/join-us"), "clicking the card navigates", `landed on ${landed}`);

    // A footer link is deliberately never prefetched — it must still navigate.
    await cdp.send("Page.navigate", { url: `${BASE}/` }, sessionId);
    await sleep(6000);
    const footerHref = await evaluate(`(() => {
      /* A route, not the QR image or any other asset the footer links to. */
      const a = [...document.querySelectorAll("footer a[href^='/'], .site-footer a[href^='/']")]
        .find((el) => {
          const href = el.getAttribute("href");
          return href && href !== "/" && !href.includes("#") && !/\\.[a-z0-9]+$/i.test(href);
        });
      if (!a) return null;
      a.scrollIntoView({ block: "center" });
      return a.getAttribute("href");
    })()`);
    check(Boolean(footerHref), "found a footer link", String(footerHref));
    await sleep(900);
    if (footerHref) {
      await evaluate(`[...document.querySelectorAll("footer a, .site-footer a")]
        .find((el) => el.getAttribute("href") === ${JSON.stringify(footerHref)}).click(); true`);
      await sleep(3500);
      const there = await evaluate(`location.pathname`);
      check(
        String(there).replace(/\/$/, "") === String(footerHref).replace(/\/$/, ""),
        "clicking an unprefetched footer link navigates",
        `landed on ${there}`
      );
    }

    console.log(`\n   ${failures === 0 ? "all good" : `${failures} failure(s)`}\n`);
  } finally {
    chrome.stop();
  }
  process.exit(failures === 0 ? 0 : 1);
})();
