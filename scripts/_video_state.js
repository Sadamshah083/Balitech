/**
 * Reports what the hero clip decided to do.
 *
 *   node scripts/_video_state.js [url] [--cpu=8] [--seconds=10]
 *
 * The clip gives up on hardware that cannot decode it in real time, which is a
 * behaviour that only appears on hardware nobody develops on. This says whether
 * it played, stuttered, or stood down, so the fallback can be checked directly
 * rather than inferred from a score.
 */
const { launch, connect, sleep } = require("./_chrome");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "http://localhost:3210/";
const num = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const CPU = num("cpu", 8);
const SECONDS = num("seconds", 10);

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Page.bringToFront", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
      sessionId
    );
    if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sessionId);

    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(SECONDS * 1000);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      {
        expression: `(() => {
          const v = document.querySelector("video.hero-bg-video--film");
          if (!v) return { found: false };
          const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
          const poster = document.querySelector("img.hero-bg-video");
          return {
            found: true,
            hasSrc: Boolean(v.getAttribute("src")),
            paused: v.paused,
            currentTime: Number(v.currentTime.toFixed(2)),
            readyState: v.readyState,
            ready: v.dataset.ready,
            dropped: q ? q.droppedVideoFrames : null,
            totalFrames: q ? q.totalVideoFrames : null,
            posterVisible: poster ? getComputedStyle(poster).opacity : "(no poster)",
          };
        })()`,
        returnByValue: true,
      },
      sessionId
    );

    const s = result.value;
    console.log(`\n${URL_ARG}   cpu x${CPU}, after ${SECONDS}s\n`);
    if (!s.found) {
      console.log("   no hero clip element on the page");
    } else if (!s.hasSrc) {
      console.log("   the clip stood down — poster only");
      console.log(`   poster opacity ${s.posterVisible}, reached ${s.currentTime}s before giving up`);
    } else {
      console.log(`   the clip is ${s.paused ? "paused" : "playing"}`);
      console.log(`   played ${s.currentTime}s of real time in ${SECONDS}s`);
      console.log(`   readyState ${s.readyState}, frames ${s.dropped}/${s.totalFrames} dropped`);
      console.log(`   poster opacity ${s.posterVisible}`);
    }
    console.log("");
  } finally {
    chrome.stop();
  }
})();
