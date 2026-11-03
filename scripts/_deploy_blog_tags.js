/**
 * Deploy www -> apex 301 (src/proxy.ts) plus pending blog admin changes.
 * Code only — no DB sync.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/components/admin/BlogsManager.tsx",
];

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(path.join(ROOT, rel), `${SERVER.remoteDir}/${rel}`);
  }
  const build = await ssh.execCommand(
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { cwd: SERVER.remoteDir, execOptions: { pty: true } }
  );
  console.log(build.stdout.trim().slice(-1500));
  if (build.code) throw new Error("build failed " + build.code);
  const r = await ssh.execCommand(`pm2 restart ${PM2_APP} --update-env`, { cwd: SERVER.remoteDir });
  console.log(r.stdout.trim().slice(-600), r.stderr.trim());
  ssh.dispose();
}
main().catch((e) => { console.error(e); process.exit(1); });
