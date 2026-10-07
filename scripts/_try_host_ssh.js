const { NodeSSH } = require("node-ssh");

async function tryConnect(label, opts) {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({ readyTimeout: 12000, ...opts });
    const r = await ssh.execCommand(
      "hostname; whoami; hostname -I; which virsh; virsh list --all 2>/dev/null | head -20; iptables -t nat -L PREROUTING -n 2>/dev/null | head -30; nft list ruleset 2>/dev/null | head -40"
    );
    console.log("OK", label);
    console.log(r.stdout || r.stderr);
    ssh.dispose();
    return true;
  } catch (e) {
    console.log("FAIL", label, e.message || e);
    try {
      ssh.dispose();
    } catch {}
    return false;
  }
}

async function main() {
  const attempts = [
    ["root@22", { host: "203.215.164.70", port: 22, username: "root", password: "balitech1" }],
    ["ubuntu@22", { host: "203.215.164.70", port: 22, username: "ubuntu", password: "balitech1" }],
    ["root@22 oldpass", { host: "203.215.164.70", port: 22, username: "root", password: "Bali@Tech123?" }],
  ];
  for (const [label, opts] of attempts) {
    await tryConnect(label, opts);
  }
}

main();
