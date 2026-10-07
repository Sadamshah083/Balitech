/**
 * Deploy job-inquiry form + footer sitemap/llms links.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, PROJECT_PORT, APP_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/components/home/BusinessInquiryForm.tsx",
  "src/components/home/DeferredBusinessInquiryForm.tsx",
  "src/components/blog/BlogListing.tsx",
  "src/components/landing/Footer.tsx",
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
    if (err) console.error(err.slice(-2000));
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
    await ssh.putFile(path.join(ROOT, rel), `${SERVER.remoteDir}/${rel}`);
  }
  await run(
    ssh,
    "build",
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { pty: true }
  );
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);
  await run(
    ssh,
    "verify",
    `sleep 3; curl -s http://127.0.0.1:${APP_PORT}/blog | tr '"' '\\n' | grep -E 'Select a role|Verifier|sitemap.xml|llms.txt|Select a service' | sort | uniq | head -30; curl -s http://127.0.0.1:${PROJECT_PORT}/ | tr '"' '\\n' | grep -E 'sitemap.xml|llms.txt' | sort | uniq`
  );
  ssh.dispose();
  console.log("\nDEPLOY_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
