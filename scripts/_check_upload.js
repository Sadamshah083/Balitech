const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP } = require("./deploy-config");
(async () => {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const cmds = [
    "grep -rn 'client_max_body_size' /etc/nginx/ || echo 'NO client_max_body_size set (default 1MB)'",
    "sudo -n tail -n 30 /var/log/nginx/error.log 2>&1 | grep -i -E 'body|large|upstream' | tail -n 10 || true",
    `pm2 logs ${PM2_APP} --lines 300 --nostream 2>&1 | grep -i -E 'api/applications|submit failed|Error' | tail -n 15`,
  ];
  for (const c of cmds) {
    const r = await ssh.execCommand(c);
    console.log("$", c, "\n", (r.stdout + r.stderr).trim().slice(-1800), "\n");
  }
  ssh.dispose();
})();
