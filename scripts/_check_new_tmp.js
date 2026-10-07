const { NodeSSH } = require("node-ssh");

async function main() {
  const n = new NodeSSH();
  await n.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
  });
  const r = await n.execCommand(
    "ls -lh /tmp/balitech-app.tgz 2>&1; ps aux | grep -E 'scp|sshpass|rsync' | grep -v grep || true"
  );
  console.log(r.stdout || r.stderr);
  n.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
