const fs = require("fs");
const path = require("path");
const os = require("os");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const outDir = path.join(os.tmpdir(), "balitech-migrate");
  fs.mkdirSync(outDir, { recursive: true });

  await ssh.getFile(path.join(outDir, ".env"), "/var/www/balitech-app/.env");
  await ssh.getFile(path.join(outDir, "nginx-balitech"), "/etc/nginx/sites-enabled/balitech");

  const env = fs.readFileSync(path.join(outDir, ".env"), "utf8");
  const keys = env
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => l.split("=")[0]);
  console.log("env keys:", keys.join(", "));
  console.log("saved to", outDir);

  const nginx = fs.readFileSync(path.join(outDir, "nginx-balitech"), "utf8");
  console.log("\n--- nginx ---\n");
  console.log(nginx);
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
