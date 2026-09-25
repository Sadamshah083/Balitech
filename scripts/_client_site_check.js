/**
 * Diagnoses client.balitech.org, which answers 500. Read-only.
 *
 *   node scripts/_client_site_check.js
 *
 * Its nginx block serves a React build from /var/www/client.balitech.org/build
 * with `try_files $uri /index.html`. That directory is missing, so the fallback
 * cannot resolve either and nginx loops until it gives up — which surfaces as a
 * 500 rather than a 404. This gathers what is actually on disk and what the API
 * it proxies is doing, without changing anything.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

const CHECKS = [
  ["nginx block", "cat /etc/nginx/sites-available/client.balitech.org"],
  ["/var/www contents", "ls -la /var/www/ 2>&1"],
  ["client dir", "ls -la /var/www/client.balitech.org/ 2>&1"],
  [
    "anything build-like nearby",
    "find /var/www/client.balitech.org -maxdepth 3 -name 'index.html' 2>/dev/null | head -10 || echo '(no index.html found)'",
  ],
  ["api on :3001", "curl -s -o /dev/null -w 'localhost:3001 -> %{http_code}\\n' http://127.0.0.1:3001/ 2>&1"],
  ["pm2 processes", "pm2 list --no-color 2>&1 | head -20"],
  ["recent errors for this vhost", "grep 'client.balitech.org' /var/log/nginx/error.log 2>/dev/null | tail -5 || echo '(none)'"],
  ["dns / cert", "ls -1 /etc/letsencrypt/live/ 2>/dev/null"],
];

(async () => {
  await ssh.connect(SERVER);

  for (const [label, cmd] of CHECKS) {
    const res = await ssh.execCommand(cmd);
    const out = [res.stdout.trimEnd(), res.stderr.trimEnd()].filter(Boolean).join("\n");
    console.log(`\n=== ${label} ===`);
    console.log(out ? out.split("\n").map((l) => "   " + l).join("\n") : "   (empty)");
  }

  ssh.dispose();
})().catch((error) => {
  console.error(error.message || error);
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
