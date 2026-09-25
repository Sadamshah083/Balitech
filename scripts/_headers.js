/**
 * Prints raw response headers and measures how much of the body is actually
 * sent over the wire.
 *
 *   node scripts/_headers.js [url] [--path=/services]
 *
 * Compression is invisible from most tooling — anything that decompresses for
 * you reports the decompressed size — so this asks for it explicitly and
 * reports the encoded byte count next to the decoded one.
 */
const https = require("node:https");
const http = require("node:http");
const zlib = require("node:zlib");

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith("--")) || "https://balitech.org/";

function fetchRaw(url, acceptEncoding) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const started = Date.now();
    let firstByte = 0;
    const req = mod.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "Accept-Encoding": acceptEncoding,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => {
          if (!firstByte) firstByte = Date.now() - started;
          chunks.push(c);
        });
        res.on("end", () => {
          const encoded = Buffer.concat(chunks);
          let decoded = encoded;
          const enc = String(res.headers["content-encoding"] || "").toLowerCase();
          try {
            if (enc === "gzip") decoded = zlib.gunzipSync(encoded);
            else if (enc === "br") decoded = zlib.brotliDecompressSync(encoded);
            else if (enc === "deflate") decoded = zlib.inflateSync(encoded);
          } catch {
            /* leave as-is */
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            encodedBytes: encoded.length,
            decodedBytes: decoded.length,
            ttfb: firstByte,
            total: Date.now() - started,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

(async () => {
  console.log(`\n${URL_ARG}\n`);

  const withBr = await fetchRaw(URL_ARG, "gzip, deflate, br");
  console.log("=== response headers (asking for gzip, deflate, br) ===");
  for (const [k, v] of Object.entries(withBr.headers)) {
    console.log(`   ${k}: ${v}`);
  }

  const none = await fetchRaw(URL_ARG, "identity");

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log("\n=== bytes over the wire ===");
  console.log(`   content-encoding      ${withBr.headers["content-encoding"] || "(none)"}`);
  console.log(`   sent compressed       ${kb(withBr.encodedBytes)}`);
  console.log(`   after decompression   ${kb(withBr.decodedBytes)}`);
  console.log(`   uncompressed request  ${kb(none.encodedBytes)}`);
  const ratio = none.encodedBytes / Math.max(1, withBr.encodedBytes);
  console.log(`   compression ratio     ${ratio.toFixed(1)}x`);
  console.log("\n=== timing ===");
  console.log(`   first byte            ${withBr.ttfb} ms`);
  console.log(`   full body             ${withBr.total} ms\n`);
})();
