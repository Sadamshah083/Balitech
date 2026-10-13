/**
 * Deploy heard-about options, walk-in admin QR, source filter + auto-capture.
 * Code only — no DB sync.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/lib/careers/catalog.ts",
  "src/lib/careers/application.ts",
  "src/lib/lead-filters.ts",
  "src/app/api/applications/route.ts",
  "src/components/join-us/JoinUsApplicationForm.tsx",
  "src/components/admin/LeadsManager.tsx",
  "src/components/admin/LeadDetail.tsx",
  "src/app/globals.css",
  "public/balitech-walk-in-qr.png",
  "CLAUDE.md",
];

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, {
    cwd: opts.cwd || SERVER.remoteDir,
    execOptions: { pty: !!opts.pty },
  });
  if (res.stdout) console.log(res.stdout.trim().slice(-3500));
  if (res.stderr) {
    const err = res.stderr.trim();
    if (err) console.error(err.slice(-1200));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  console.log("Deploying source / walk-in QR — code only, DB untouched");
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(
      path.join(ROOT, rel.replace(/\//g, path.sep)),
      `${SERVER.remoteDir}/${rel}`
    );
  }

  await run(ssh, "build", "export NODE_OPTIONS=--max-old-space-size=3072; npm run build", {
    pty: true,
  });

  const restart = await ssh.execCommand(`pm2 restart ${PM2_APP} --update-env`, {
    cwd: SERVER.remoteDir,
  });
  if (restart.code && restart.code !== 0) {
    await run(ssh, "pm2 delete", `pm2 delete ${PM2_APP} || true`, { allowFail: true });
    await run(ssh, "pm2 start", "pm2 start ecosystem.config.js");
    await run(ssh, "pm2 save", "pm2 save", { allowFail: true });
  } else if (restart.stdout) {
    console.log(restart.stdout.trim().slice(-1200));
  }

  await run(
    ssh,
    "verify",
    `sleep 5; curl -s -o /dev/null -w 'join:%{http_code} walkin_qr:%{http_code} admin_leads:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/join-us http://127.0.0.1:${APP_PORT}/balitech-walk-in-qr.png http://127.0.0.1:${APP_PORT}/admin/leads`
  );

  ssh.dispose();
  console.log(`\nOK http://${SERVER.host}:${PROJECT_PORT}/admin/leads`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
