/**
 * Measures how smoothly a page scrolls, and what is costing the frames.
 *
 *   node scripts/_scroll_perf.js [url] [--mobile] [--noglass] [--noatmo]
 *                                [--noribbon] [--noblur] [--noshadow]
 *
 * Load performance and scroll performance fail for different reasons, so the
 * Lighthouse numbers say nothing about this. The scroll is driven through
 * Chrome's own gesture synthesiser rather than `scrollTo`, so it goes down the
 * real input path and the compositor behaves as it would for a finger or wheel.
 *
 * The `--no*` switches disable one suspect at a time. Run the page once clean
 * and once with a switch, and the difference is what that effect costs.
 */
const { launch, connect, sleep } = require("./_chrome");
const { pick } = require("./_scroll_variants");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org/";
const MOBILE = args.includes("--mobile");
const SINGLE = args.includes("--single");

/* Shared with _scroll_trace.js. This file used to keep its own copy, and the
   copy went stale: the strand filters moved onto per-weight group classes and
   `--nostrandblur` here still named `.light-path__strand`, so the switch
   matched nothing and quietly reported that blur was free. */
const { css: OVERRIDES, label: LABEL } = pick(args);

const WATCH = `
  window.__frames = [];
  window.__long = [];
  let last = performance.now();
  const tick = (t) => {
    window.__frames.push(t - last);
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__long.push(Math.round(e.duration));
    }).observe({ type: "longtask", buffered: true });
  } catch {}
`;

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  const evaluate = async (expression, sessionId) => {
    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    return result.value;
  };

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Performance.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);

    if (MOBILE) {
      await cdp.send(
        "Emulation.setDeviceMetricsOverride",
        { width: 412, height: 823, deviceScaleFactor: 2, mobile: true },
        sessionId
      );
      /* A mid-range phone, which is where scrolling actually hurts. */
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 }, sessionId);
    } else {
      await cdp.send(
        "Emulation.setDeviceMetricsOverride",
        { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
        sessionId
      );
    }

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    /* Past the intro overlay and the deferred effects arming themselves. */
    await sleep(MOBILE ? 9000 : 6000);

    if (OVERRIDES.length) {
      await evaluate(
        `(() => {
          const s = document.createElement("style");
          s.textContent = ${JSON.stringify(OVERRIDES.join("\n"))};
          document.head.appendChild(s);
          return "ok";
        })()`,
        sessionId
      );
      await sleep(1200);
    }

    /* The ribbon and atmosphere only build after a first interaction, so nudge
       the page before measuring — otherwise the clean run measures a page that
       has not switched its effects on yet. */
    await cdp.send(
      "Input.synthesizeScrollGesture",
      { x: MOBILE ? 200 : 700, y: MOBILE ? 400 : 450, xDistance: 0, yDistance: -200, speed: 2000 },
      sessionId
    );
    await sleep(2500);

    await evaluate(`window.scrollTo(0, 0); "ok"`, sessionId);
    await sleep(800);
    await evaluate(WATCH, sessionId);
    await sleep(400);
    const startedAt = Date.now();

    const before = (await cdp.send("Performance.getMetrics", {}, sessionId)).metrics;
    const m = (list, name) => list.find((x) => x.name === name)?.value ?? 0;

    /* Several passes down the page: one sweep only exercises the sections it
       happens to cross while they are still being rendered for the first time.

       `--single` does one continuous pass at reading speed and never jumps back
       to the top. The jump is itself the most expensive frame in the run — it
       renders the hero from scratch — so on a fast machine, where the passes
       finish quickly, those three frames are a large share of everything
       measured and they drown out the scrolling they were meant to frame. */
    const docHeight = await evaluate(`document.documentElement.scrollHeight`, sessionId);
    const passes = SINGLE ? 1 : 3;
    for (let i = 0; i < passes; i++) {
      await cdp.send(
        "Input.synthesizeScrollGesture",
        {
          x: MOBILE ? 200 : 700,
          y: MOBILE ? 400 : 450,
          xDistance: 0,
          yDistance: -Math.min(docHeight, SINGLE ? 7000 : 9000),
          speed: SINGLE ? 1400 : 3000,
          gestureSourceType: MOBILE ? "touch" : "mouse",
        },
        sessionId
      );
      await sleep(600);
      if (SINGLE) break;
      await evaluate(`window.scrollTo(0, 0); "ok"`, sessionId);
      await sleep(500);
    }

    const elapsedMs = Date.now() - startedAt;
    const after = (await cdp.send("Performance.getMetrics", {}, sessionId)).metrics;
    const stats = await evaluate(
      `JSON.stringify({ frames: window.__frames || [], long: window.__long || [] })`,
      sessionId
    );
    const { frames, long } = JSON.parse(stats);

    /* The first few frames cover the gap before the gesture starts. */
    const f = frames.slice(3).filter((x) => x > 0 && x < 2000);
    f.sort((a, b) => a - b);
    const pct = (p) => f[Math.min(f.length - 1, Math.floor((f.length * p) / 100))] || 0;
    const budget = 1000 / 60;
    const dropped = f.filter((x) => x > budget * 1.5).length;
    const bad = f.filter((x) => x > 50).length;

    console.log(`\n${MOBILE ? "MOBILE (4x CPU)" : "DESKTOP"}  ${URL_ARG}`);
    console.log(`variant: ${LABEL}\n`);
    console.log(`   frames measured      ${f.length}`);
    console.log(`   median frame         ${pct(50).toFixed(1)} ms   (60fps budget is 16.7)`);
    console.log(`   p95 frame            ${pct(95).toFixed(1)} ms`);
    console.log(`   worst frame          ${(f[f.length - 1] || 0).toFixed(1)} ms`);
    console.log(
      `   janky frames         ${dropped} (${((dropped / f.length) * 100).toFixed(1)}%) over 25ms, ${bad} over 50ms`
    );
    /* The number to trust. A median frame can sit exactly on 16.7ms while the
       page still delivers a third of the frames it should, because everything
       lost went into a handful of very long ones — and a percentage of janky
       frames hides that too, since it shrinks as the sample shrinks. Frames
       actually delivered over a fixed stretch of scrolling cannot be gamed
       that way. */
    console.log(
      `   FRAMES DELIVERED     ${f.length} in ${(elapsedMs / 1000).toFixed(1)}s = ${(
        (f.length / elapsedMs) *
        1000
      ).toFixed(1)} fps average   (60 is the target)`
    );
    console.log(`\n   long tasks           ${long.length}${long.length ? ", worst " + Math.max(...long) + " ms" : ""}`);
    console.log(
      `   during scroll:  layout ${(m(after, "LayoutDuration") - m(before, "LayoutDuration")).toFixed(
        3
      )}s   style ${(m(after, "RecalcStyleDuration") - m(before, "RecalcStyleDuration")).toFixed(
        3
      )}s   script ${(m(after, "ScriptDuration") - m(before, "ScriptDuration")).toFixed(3)}s`
    );
    console.log(
      `   layout passes ${m(after, "LayoutCount") - m(before, "LayoutCount")}, style recalcs ${
        m(after, "RecalcStyleCount") - m(before, "RecalcStyleCount")
      }\n`
    );
  } finally {
    cdp.close();
    chrome.stop();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
