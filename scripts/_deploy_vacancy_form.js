/**
 * Deploy easier admin vacancy form + description limit bump.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/components/admin/VacanciesManager.tsx",
  "src/lib/careers/vacancies.ts",
  "src/lib/careers/catalog.ts",
];

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, {
    cwd: opts.cwd || SERVER.remoteDir,
    execOptions: { pty: !!opts.pty },
  });
  if (res.stdout) console.log(res.stdout.trim().slice(-4000));
  if (res.stderr) {
    const err = res.stderr.trim();
    if (err) console.error(err.slice(-1500));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(path.join(ROOT, rel.replace(/\//g, path.sep)), `${SERVER.remoteDir}/${rel}`);
  }

  await run(ssh, "build", "export NODE_OPTIONS=--max-old-space-size=3072; npm run build", {
    pty: true,
  });
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);

  await run(
    ssh,
    "verify admin vacancies page",
    `sleep 3; curl -s -o /dev/null -w 'admin_vacancies:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/admin/vacancies; curl -s http://127.0.0.1:${APP_PORT}/admin/login | tr '"' '\\n' | grep -E 'Bali|Admin|login' | head -5`
  );

  ssh.dispose();
  console.log(`\nOK admin form live — http://${SERVER.host}:${PROJECT_PORT}/admin/vacancies`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
