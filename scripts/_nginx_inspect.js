/**
 * Read-only look at the live nginx setup.
 *
 *   node scripts/_nginx_inspect.js
 *
 * The app is now cheap enough that the server is what the score is waiting on:
 * production answers on HTTP/1.1, so twenty requests queue over a handful of
 * connections, and it compresses with gzip only. Both are nginx settings rather
 * than anything in the bundle. This only reads — it changes nothing.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

const COMMANDS = [
  ["nginx version + modules", "nginx -V 2>&1 | tr ' ' '\\n' | grep -E 'nginx/|http_v2|brotli' | sort -u"],
  ["config files", "ls -1 /etc/nginx/sites-enabled/ 2>/dev/null; ls -1 /etc/nginx/conf.d/ 2>/dev/null"],
  ["listen directives", "grep -rn 'listen' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | grep -v '^\\s*#'"],
  ["http2 / brotli mentions", "grep -rn 'http2\\|brotli\\|gzip' /etc/nginx/nginx.conf /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | grep -v '^\\s*#'"],
  ["brotli module available", "ls -1 /usr/lib/nginx/modules/ 2>/dev/null | grep -i brotli || echo '(no brotli module)'"],
  ["balitech server block", "grep -rl 'balitech' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null"],
];

(async () => {
  await ssh.connect(SERVER);

  for (const [label, cmd] of COMMANDS) {
    const res = await ssh.execCommand(cmd);
    const out = [res.stdout.trim(), res.stderr.trim()].filter(Boolean).join("\n");
    console.log(`\n=== ${label} ===`);
    console.log(out ? out.split("\n").map((l) => "   " + l).join("\n") : "   (empty)");
  }

  /* The whole server block, so any change is proposed against what is actually
     deployed rather than a guess at its shape. */
  const files = await ssh.execCommand(
    "grep -rl 'balitech' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -2"
  );
  for (const file of files.stdout.trim().split("\n").filter(Boolean)) {
    const body = await ssh.execCommand(`cat ${file}`);
    console.log(`\n=== ${file} ===`);
    console.log(body.stdout.split("\n").map((l) => "   " + l).join("\n"));
  }

  ssh.dispose();
})().catch((error) => {
  console.error(error.message || error);
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
