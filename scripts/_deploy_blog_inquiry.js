/**
 * Upload blog inquiry form changes and rebuild on the new guest.
 * Does not touch the database.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/components/blog/BlogListing.tsx",
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
    if (err) console.error(err.slice(-2500));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  console.log("Connected", SERVER.host + ":" + SERVER.port);

  for (const rel of FILES) {
    const local = path.join(ROOT, rel);
    const remote = `${SERVER.remoteDir}/${rel.replace(/\\/g, "/")}`;
    console.log("\n>> put", rel);
    await ssh.putFile(local, remote);
  }

  // Confirm inquiry form is in the uploaded file
  await run(
    ssh,
    "verify upload",
    "grep -n DeferredBusinessInquiryForm src/components/blog/BlogListing.tsx | head -5"
  );

  await run(
    ssh,
    "build on server (live DB, no local push)",
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { pty: true }
  );

  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);
  await run(
    ssh,
    "health",
    `sleep 3; curl -s -o /dev/null -w 'local3080:%{http_code} app:%{http_code}\\n' http://127.0.0.1:${PROJECT_PORT}/blog http://127.0.0.1:${APP_PORT}/blog; grep -c DeferredBusinessInquiryForm .next/server/chunks/*.js 2>/dev/null | head -3 || true`
  );

  ssh.dispose();
  console.log("\nDEPLOY_OK — blog inquiry form is live on the new guest.");
  console.log(`Open: http://${SERVER.host}:${PROJECT_PORT}/blog`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
