/**
 * Which protocol production actually negotiates, per request.
 *
 *   node scripts/_protocol_check.js [url]
 *
 * The local curl is a Schannel build with no HTTP/2 support, so it reports 1.1
 * regardless of what the server offers. A real browser reports the negotiated
 * protocol on every resource timing entry, which is the thing that matters
 * anyway: whether all the page's requests share one connection.
 */
const { launch, connect, sleep } = require("./_chrome");

const URL_ARG = process.argv[2] || "https://balitech.org/";

const PROBE = `JSON.stringify((() => {
  const rs = performance.getEntriesByType("resource");
  const nav = performance.getEntriesByType("navigation")[0];
  const counts = {};
  for (const r of rs) {
    const p = r.nextHopProtocol || "(unknown)";
    counts[p] = (counts[p] || 0) + 1;
  }
  return {
    document: nav ? nav.nextHopProtocol : null,
    resources: rs.length,
    counts,
    ttfb: nav ? Math.round(nav.responseStart) : null,
  };
})())`;

(async () => {
  const chrome = await launch({ port: 9700 + (process.pid % 200) });

  try {
    const cdp = connect(chrome.wsUrl);
    await cdp.ready;

    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Page.navigate", { url: URL_ARG }, sessionId);
    await sleep(6000);

    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      sessionId
    );
    const r = JSON.parse(result.value);
    cdp.close();

    console.log(`\n${URL_ARG}\n`);
    console.log(`   document protocol : ${r.document}`);
    console.log(`   document TTFB     : ${r.ttfb} ms`);
    console.log(`   resources         : ${r.resources}`);
    console.log(`\n   protocol per resource:`);
    for (const [proto, n] of Object.entries(r.counts).sort((a, b) => b[1] - a[1])) {
      console.log(`      ${String(n).padStart(3)}  ${proto}`);
    }

    const onH2 = r.document === "h2";
    console.log(`\n${onH2 ? "PASS" : "FAIL"}: production is serving over ${r.document}\n`);
    process.exitCode = onH2 ? 0 : 1;
  } finally {
    chrome.stop();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
