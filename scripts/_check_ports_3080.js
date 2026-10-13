const { NodeSSH } = require("node-ssh");
const { SERVER, APP_PORT, PROJECT_PORT, PM2_APP } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const cmds = [
    "pm2 list",
    `ss -lntp | grep -E ':(3005|3080|80|443)\\b' || netstat -lntp 2>/dev/null | grep -E ':(3005|3080|80|443)\\b' || true`,
    "ls -la /etc/nginx/sites-enabled/ 2>/dev/null; ls -la /etc/nginx/conf.d/ 2>/dev/null; true",
    "grep -RInE '3080|3005|balitech|proxy_pass' /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx/nginx.conf 2>/dev/null | head -80 || true",
    `curl -s -o /dev/null -w 'app_${APP_PORT}:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/ || true`,
    `curl -s -o /dev/null -w 'project_${PROJECT_PORT}:%{http_code}\\n' http://127.0.0.1:${PROJECT_PORT}/ || true`,
    "curl -s -o /dev/null -w 'nginx_80:%{http_code}\\n' http://127.0.0.1/ || true",
  ];
  for (const cmd of cmds) {
    console.log("\n>>", cmd);
    const res = await ssh.execCommand(cmd, { cwd: SERVER.remoteDir });
    if (res.stdout) console.log(res.stdout.trim().slice(-4000));
    if (res.stderr) console.error(res.stderr.trim().slice(-800));
  }
  ssh.dispose();
  console.log(`\nConfigured APP_PORT=${APP_PORT} PROJECT_PORT=${PROJECT_PORT} PM2=${PM2_APP}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
