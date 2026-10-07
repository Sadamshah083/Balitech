const { NodeSSH } = require("node-ssh");
const { SERVER, APP_PORT, PROJECT_PORT } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const cmds = [
    "sudo cat /etc/nginx/sites-available/balitech",
    "ls -la /etc/nginx/sites-enabled/",
    "ss -lntp | grep -E ':(80|443|3080|3005)\\b' || true",
    `curl -sI http://127.0.0.1:${APP_PORT}/ | head -50`,
    `curl -sI -H 'Accept-Encoding: gzip, br' http://127.0.0.1:${APP_PORT}/_next/static/css/ 2>/dev/null | head -5; ls ${SERVER.remoteDir}/.next/static/chunks 2>/dev/null | head -5`,
  ];
  for (const cmd of cmds) {
    console.log("\n====", cmd);
    const r = await ssh.execCommand(cmd);
    console.log((r.stdout || r.stderr || "").slice(0, 6000));
  }
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
