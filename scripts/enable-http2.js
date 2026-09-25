/**
 * Enables HTTP/2 for balitech.org.
 *
 *   node scripts/enable-http2.js [--revert]
 *
 * Production answers on HTTP/1.1, so the twenty requests the home page makes are
 * spread over about six connections and each one pays its own TCP and TLS
 * handshake — roughly 330 ms apiece from outside the datacentre. HTTP/2 serves
 * all of them over the single connection that is already open.
 *
 * nginx 1.18 here is built --with-http_v2_module, so this is one token on one
 * `listen` line. Safety, in order:
 *  - Only the balitech server block is touched; the other sites on this nginx
 *    are left exactly as they are.
 *  - The file is copied aside first, and restored if anything below fails.
 *  - `nginx -t` validates the whole config before any reload happens.
 *  - The reload is a graceful signal, so in-flight requests finish and there is
 *    no downtime.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

const SITE = "/etc/nginx/sites-enabled/balitech";
/* Deliberately outside sites-enabled: nginx includes that directory wholesale,
   and a backup of a server block sitting next to the original is one glob change
   away from being loaded as a duplicate. */
const BACKUP = "/etc/nginx/balitech.pre-http2.bak";
const REVERT = process.argv.includes("--revert");

async function run(cmd, { allowFail = false } = {}) {
  const res = await ssh.execCommand(cmd);
  const out = [res.stdout.trim(), res.stderr.trim()].filter(Boolean).join("\n");
  if (out) console.log(out.split("\n").map((l) => "   " + l).join("\n"));
  if (!allowFail && res.code !== 0) {
    throw new Error(`Failed (${res.code}): ${cmd}`);
  }
  return res;
}

async function restore(reason) {
  console.log(`\n${reason} — restoring the previous config`);
  await run(`cp ${BACKUP} ${SITE}`, { allowFail: true });
  await run("nginx -t", { allowFail: true });
  await run("systemctl reload nginx", { allowFail: true });
  console.log("   previous config restored");
}

async function main() {
  await ssh.connect(SERVER);

  if (REVERT) {
    const exists = await ssh.execCommand(`test -f ${BACKUP} && echo yes || echo no`);
    if (exists.stdout.trim() !== "yes") {
      throw new Error(`No backup at ${BACKUP}; nothing to revert to.`);
    }
    await restore("Reverting on request");
    ssh.dispose();
    return;
  }

  console.log("=== before ===");
  await run(`grep -n 'listen' ${SITE}`);

  const already = await ssh.execCommand(`grep -c 'listen 443 ssl http2' ${SITE} || true`);
  if (Number(already.stdout.trim()) > 0) {
    console.log("\nHTTP/2 is already enabled; nothing to do.");
    ssh.dispose();
    return;
  }

  console.log(`\n=== backing up to ${BACKUP} ===`);
  await run(`cp ${SITE} ${BACKUP} && ls -l ${BACKUP}`);

  /* Anchored to the exact current line so a stray "listen 443 ssl" elsewhere in
     the file, or a re-run, cannot produce "http2 http2". */
  console.log("\n=== editing ===");
  await run(
    `sed -i 's|^\\(\\s*\\)listen 443 ssl;|\\1listen 443 ssl http2;|' ${SITE}`
  );
  await run(`grep -n 'listen' ${SITE}`);

  const changed = await ssh.execCommand(`grep -c 'listen 443 ssl http2;' ${SITE} || true`);
  if (Number(changed.stdout.trim()) !== 1) {
    await restore("Edit did not apply exactly once");
    ssh.dispose();
    process.exit(1);
  }

  console.log("\n=== validating whole nginx config ===");
  const test = await ssh.execCommand("nginx -t 2>&1");
  console.log(test.stdout.trim().split("\n").map((l) => "   " + l).join("\n"));
  if (!/syntax is ok/i.test(test.stdout) || !/test is successful/i.test(test.stdout)) {
    await restore("nginx -t rejected the config");
    ssh.dispose();
    process.exit(1);
  }

  console.log("\n=== graceful reload ===");
  await run("systemctl reload nginx");
  await run("sleep 2", { allowFail: true });
  await run("systemctl is-active nginx");

  console.log("\n=== verifying from the server ===");
  await run(
    `curl -s -o /dev/null -w "   local https: %{http_version}  %{http_code}\\n" -k https://127.0.0.1/ -H "Host: balitech.org"`,
    { allowFail: true }
  );

  ssh.dispose();
  console.log("\nHTTP/2 enabled. Revert with: node scripts/enable-http2.js --revert");
}

main().catch(async (error) => {
  console.error("\n" + (error.message || error));
  try {
    await restore("Unexpected failure");
  } catch {}
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
