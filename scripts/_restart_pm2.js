const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");
(async () => {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const r = await ssh.execCommand("pm2 restart balitech-app --update-env || pm2 start ecosystem.config.js --update-env");
  console.log(r.stdout || r.stderr);
  ssh.dispose();
})().catch((e) => { console.error(e); process.exit(1); });
