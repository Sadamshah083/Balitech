const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  const cmds = [
    { cmd: `pm2 delete ${PM2_APP} || true`, allowFail: true },
    { cmd: "pm2 start ecosystem.config.js", allowFail: false },
    { cmd: "pm2 save", allowFail: false },
    {
      cmd: `sleep 5; curl -s -o /dev/null -w 'home:%{http_code} about:%{http_code} services:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/ http://127.0.0.1:${APP_PORT}/about http://127.0.0.1:${APP_PORT}/services`,
      allowFail: false,
    },
    { cmd: "pm2 list", allowFail: true },
  ];

  for (const { cmd, allowFail } of cmds) {
    console.log("\n>>", cmd);
    const res = await ssh.execCommand(cmd, { cwd: SERVER.remoteDir });
    if (res.stdout) console.log(res.stdout.trim().slice(-2500));
    if (res.stderr) console.error(res.stderr.trim().slice(-800));
    if (!allowFail && res.code && res.code !== 0) {
      throw new Error(`${cmd} failed (${res.code})`);
    }
  }

  ssh.dispose();
  console.log(`\nOK http://${SERVER.host}:${PROJECT_PORT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
