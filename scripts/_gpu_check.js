/**
 * Reports which GL renderer headless Chrome is using.
 *
 *   node scripts/_gpu_check.js
 *
 * Matters for reading the scroll traces: if this says SwiftShader, rasterisation
 * is running on the CPU and the GPU numbers in those traces are far worse than
 * anything a real machine would see. Filters and blurs are exactly the work
 * that difference falls on, so it decides whether a raster figure is a finding
 * or an artefact of the harness.
 */
const { launch, connect, sleep } = require("./_chrome");

(async () => {
  const chrome = await launch();
  const cdp = connect(chrome.wsUrl);
  await cdp.ready;

  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Runtime.enable", {}, sessionId);
    await sleep(500);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      {
        expression: `(() => {
          const c = document.createElement("canvas");
          const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
          if (!gl) return "no webgl context";
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          return JSON.stringify({
            vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
            renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          });
        })()`,
        returnByValue: true,
      },
      sessionId
    );

    console.log("");
    let info;
    try {
      info = JSON.parse(result.value);
    } catch {
      console.log(`   ${result.value}`);
      return;
    }
    console.log(`   vendor    ${info.vendor}`);
    console.log(`   renderer  ${info.renderer}`);

    const software = /swiftshader|software|llvmpipe/i.test(
      `${info.vendor} ${info.renderer}`
    );
    console.log(
      `\n   ${
        software
          ? "SOFTWARE rasterisation — treat GPU raster totals in the traces as an upper bound,\n   not as what a real machine pays."
          : "Hardware GPU — raster totals in the traces are representative."
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
