/**
 * Verifies the interaction-gated scroll ribbon.
 *
 *   node scripts/_ribbon_check.js [url] [--cpu=4]
 *
 * The ribbon is built on first interaction rather than on a timer, which is
 * what took GSAP and a full-page SVG rasterisation off the load path. That
 * trade only holds if the effect still appears for a real visitor, so this
 * checks both halves: absent before any input, fully built after a scroll.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:3300/";
const CPU = Number(flag("cpu", 4));

const PROBE = `JSON.stringify((() => {
  const root = document.querySelector(".light-path");
  const svg = root && root.querySelector(".light-path__svg");
  const comet = root && root.querySelector(".light-path__comet");
  const curtain = root && root.querySelector(".light-path__curtain");
  return {
    rootPresent: Boolean(root),
    svgBuilt: Boolean(svg),
    svgSize: svg ? svg.getAttribute("width") + "x" + svg.getAttribute("height") : null,
    cometTransform: comet ? comet.getAttribute("transform") : null,
    curtainTransform: curtain ? getComputedStyle(curtain).transform : null,
    strands: root ? root.querySelectorAll("path").length : 0,
  };
})())`;

(async () => {
  const chrome = await launch({ port: 9700 + (process.pid % 200) });

  try {
    const cdp = connect(chrome.wsUrl);
    await cdp.ready;

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 412, height: 915, deviceScaleFactor: 2, mobile: true },
      sessionId
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);
    await cdp.send("Page.enable", {}, sessionId);

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);

    /* Well past the point the old timer would have fired, so anything still
       missing is missing because nobody has interacted. */
    await sleep(5000);

    const read = async () => {
      const { result } = await cdp.send(
        "Runtime.evaluate",
        { expression: PROBE, returnByValue: true },
        sessionId
      );
      return JSON.parse(result.value);
    };

    /* Chunk filenames are hashed, so the question "did GSAP load" is answered
       by how many script bytes the page actually fetched. GSAP plus
       ScrollTrigger is ~45 KiB over two chunks, far above the noise between
       two reads of the same page. */
    const scriptBytes = async () => {
      const { result } = await cdp.send(
        "Runtime.evaluate",
        {
          expression: `JSON.stringify((() => {
            const js = performance.getEntriesByType("resource")
              .filter((r) => r.initiatorType === "script" || /\\.js(\\?|$)/.test(r.name));
            return {
              count: js.length,
              kib: Math.round(js.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024),
            };
          })())`,
          returnByValue: true,
        },
        sessionId
      );
      return JSON.parse(result.value);
    };

    const before = await read();
    const jsBefore = await scriptBytes();

    console.log(`\n${URL_ARG}   ${CPU}x CPU`);
    console.log(`\nbefore any interaction`);
    console.log(`   root in DOM        ${before.rootPresent}`);
    console.log(`   ribbon built       ${before.svgBuilt}  ${before.svgSize || ""}`);
    console.log(`   strand paths       ${before.strands}`);
    console.log(`   scripts fetched    ${jsBefore.count} files, ${jsBefore.kib} KiB`);

    await cdp.send(
      "Runtime.evaluate",
      { expression: `window.scrollBy({ top: 1200, behavior: "instant" })` },
      sessionId
    );

    /* Allows for the remaining hero-intro hold, the idle callback, the GSAP
       fetch, and the reveal actually running. */
    await sleep(6000);

    const after = await read();
    const jsAfter = await scriptBytes();

    console.log(`\nafter scrolling 1200px`);
    console.log(`   ribbon built       ${after.svgBuilt}  ${after.svgSize || ""}`);
    console.log(`   strand paths       ${after.strands}`);
    console.log(`   comet placed       ${after.cometTransform || "(none)"}`);
    console.log(`   curtain transform  ${after.curtainTransform || "(none)"}`);
    console.log(`   scripts fetched    ${jsAfter.count} files, ${jsAfter.kib} KiB`);
    console.log(
      `   deferred on scroll ${jsAfter.count - jsBefore.count} files, ${jsAfter.kib - jsBefore.kib} KiB`
    );

    cdp.close();

    const deferred = !before.svgBuilt && before.strands === 0;
    const live =
      after.svgBuilt &&
      after.strands > 0 &&
      Boolean(after.cometTransform) &&
      after.curtainTransform !== "none" &&
      jsAfter.kib > jsBefore.kib;

    console.log(`\n   deferred before input : ${deferred ? "yes" : "NO"}`);
    console.log(`   live after scroll     : ${live ? "yes" : "NO"}`);
    console.log(`\n${deferred && live ? "PASS" : "FAIL"}\n`);
    process.exitCode = deferred && live ? 0 : 1;
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
