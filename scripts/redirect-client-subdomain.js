/**
 * Points client.balitech.org at the main site instead of answering 500.
 *
 *   node scripts/redirect-client-subdomain.js [--revert]
 *
 * The React app this vhost served was never deployed, or was removed: there is
 * no /var/www/client.balitech.org at all, and nothing listens on the :3001 that
 * its /api/ block proxies to. With neither `$uri` nor the `/index.html`
 * fallback resolvable, `try_files` redirects internally until nginx gives up,
 * which is why visitors got a 500 rather than a 404.
 *
 * A valid Let's Encrypt certificate for the subdomain already exists, so this
 * answers on 443 as well — otherwise HTTPS visitors would land on the default
 * vhost instead of being redirected.
 *
 * Safety: the original is copied aside, `nginx -t` gates the reload, the reload
 * is graceful, and any failure restores the previous file.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

const SITE = "/etc/nginx/sites-available/client.balitech.org";
const BACKUP = "/etc/nginx/client.balitech.org.pre-redirect.bak";
const REVERT = process.argv.includes("--revert");

const CONFIG = `# client.balitech.org
#
# The React build and the :3001 API this vhost expects are both absent, so
# try_files looped on a missing /index.html and the subdomain served 500s.
# Redirected to the main site until that app is actually deployed; the previous
# config is kept at ${BACKUP}.
server {
    listen 80;
    listen 443 ssl http2;
    server_name client.balitech.org;

    ssl_certificate /etc/letsencrypt/live/client.balitech.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/client.balitech.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Left reachable so an http-01 renewal is not redirected away and the
    # certificate keeps renewing while the subdomain is dormant.
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Paths under this subdomain have no counterpart on the main site, so they
    # all go to the root rather than being turned into 404s.
    location / {
        return 301 https://balitech.org/;
    }
}
`;

async function run(cmd, { allowFail = false } = {}) {
  const res = await ssh.execCommand(cmd);
  const out = [res.stdout.trimEnd(), res.stderr.trimEnd()].filter(Boolean).join("\n");
  if (out) console.log(out.split("\n").map((l) => "   " + l).join("\n"));
  if (!allowFail && res.code !== 0) throw new Error(`Failed (${res.code}): ${cmd}`);
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
    if (exists.stdout.trim() !== "yes") throw new Error(`No backup at ${BACKUP}.`);
    await restore("Reverting on request");
    ssh.dispose();
    return;
  }

  console.log("=== current state ===");
  await run(
    `curl -s -o /dev/null -w "   http://client.balitech.org -> %{http_code}\\n" -H "Host: client.balitech.org" http://127.0.0.1/`,
    { allowFail: true }
  );

  console.log(`\n=== backing up to ${BACKUP} ===`);
  await run(`cp ${SITE} ${BACKUP} && ls -l ${BACKUP}`);

  console.log("\n=== writing redirect vhost ===");
  const encoded = Buffer.from(CONFIG, "utf8").toString("base64");
  await run(`echo '${encoded}' | base64 -d > ${SITE} && cat ${SITE}`);

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

  console.log("\n=== verifying ===");
  await run(
    `curl -s -o /dev/null -w "   http  -> %{http_code} %{redirect_url}\\n" -H "Host: client.balitech.org" http://127.0.0.1/`,
    { allowFail: true }
  );
  await run(
    `curl -s -o /dev/null -k -w "   https -> %{http_code} %{redirect_url}\\n" -H "Host: client.balitech.org" https://127.0.0.1/`,
    { allowFail: true }
  );
  console.log("\n   main site unaffected:");
  await run(
    `curl -s -o /dev/null -k -w "   balitech.org -> %{http_code}\\n" -H "Host: balitech.org" https://127.0.0.1/`,
    { allowFail: true }
  );

  ssh.dispose();
  console.log(
    "\nclient.balitech.org now redirects to the main site." +
      "\nRevert with: node scripts/redirect-client-subdomain.js --revert"
  );
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
