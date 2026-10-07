const { NodeSSH } = require("node-ssh");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "157.173.222.222",
    username: "root",
    password: "Bali@Tech123?",
    readyTimeout: 60000,
  });

  const cmds = [
    "iptables -I INPUT -p tcp --dport 3080 -j ACCEPT || true",
    "iptables -I INPUT -p tcp --dport 3080 -j ACCEPT || true",
    "ufw allow 3080/tcp || true",
    "firewall-cmd --permanent --add-port=3080/tcp 2>/dev/null; firewall-cmd --reload 2>/dev/null || true",
    "ss -tlnp | grep 3080",
    "curl -s -o /dev/null -w 'local:%{http_code}\\n' http://127.0.0.1:3080/",
    "curl -s -o /dev/null -w 'publicip:%{http_code}\\n' http://157.173.222.222:3080/ || true",
  ];
  for (const c of cmds) {
    const r = await ssh.execCommand(c);
    console.log("##", c);
    console.log((r.stdout || r.stderr || "").trim());
  }
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
