const dns = require("dns").promises;
const { NodeSSH } = require("node-ssh");

async function main() {
  const a = await dns.resolve4("balitech.org").catch((e) => [String(e)]);
  const www = await dns.resolve4("www.balitech.org").catch((e) => [String(e)]);
  console.log("balitech.org A:", a);
  console.log("www A:", www);

  const ssh = new NodeSSH();
  await ssh.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
  });
  const r = await ssh.execCommand(
    "hostname -I; curl -sI http://127.0.0.1/ | head -5; ls /etc/nginx/sites-enabled/; echo '---'; dig +short balitech.org @8.8.8.8; dig +short www.balitech.org @8.8.8.8"
  );
  console.log(r.stdout || r.stderr);
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
