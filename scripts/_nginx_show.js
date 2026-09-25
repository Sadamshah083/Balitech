/**
 * Prints the live nginx server blocks for balitech.org. Read-only.
 *
 *   node scripts/_nginx_show.js
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

(async () => {
  await ssh.connect(SERVER);

  for (const file of ["/etc/nginx/sites-enabled/balitech", "/etc/nginx/sites-enabled/client.balitech.org"]) {
    const res = await ssh.execCommand(`cat -n ${file} 2>/dev/null`);
    console.log(`\n=== ${file} ===`);
    console.log(res.stdout.trimEnd() || "   (not present)");
  }

  const listens = await ssh.execCommand(
    "grep -n 'listen' /etc/nginx/sites-enabled/balitech /etc/nginx/sites-enabled/client.balitech.org 2>/dev/null"
  );
  console.log(`\n=== listen lines ===`);
  console.log(listens.stdout.trimEnd() || "   (none)");

  ssh.dispose();
})().catch((error) => {
  console.error(error.message || error);
  try {
    ssh.dispose();
  } catch {}
  process.exit(1);
});
