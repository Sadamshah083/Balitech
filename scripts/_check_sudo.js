const { NodeSSH } = require("node-ssh");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
  });
  const r1 = await ssh.execCommand("sudo -n true; echo NOPASS:$?");
  console.log("nopass", r1.stdout, r1.stderr);
  const r2 = await ssh.execCommand("echo balitech1 | sudo -S true; echo WITHPASS:$?");
  console.log("withpass", r2.stdout, r2.stderr);
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
