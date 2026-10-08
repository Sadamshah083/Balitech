/**
 * Deploy leads admin UI (search, clear fields, mobile responsive).
 * Code only — no DB sync, seed, or prisma db push.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/lib/lead-filters.ts",
  "src/app/api/leads/route.ts",
  "src/components/admin/LeadsManager.tsx",
  "src/components/admin/LeadDetail.tsx",
  "src/app/globals.css",
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
  console.log("Deploying leads search UI — code only, DB untouched");
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
    "verify",
    `sleep 3; curl -s -o /dev/null -w 'home:%{http_code} admin_leads:%{http_code} career:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/ http://127.0.0.1:${APP_PORT}/admin/leads http://127.0.0.1:${APP_PORT}/career`
  );

  ssh.dispose();
  console.log(`\nOK http://${SERVER.host}:${PROJECT_PORT}/admin/leads`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
