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
  const cmds = [
    "ss -tlnp | grep -E ':80|:443|:3005' || netstat -tlnp | grep -E ':80|:443|:3005'",
    "ls -la /etc/nginx/sites-enabled/",
    "sudo nginx -T 2>/dev/null | grep -E 'server_name|listen |proxy_pass|root ' | head -40",
    "curl -sI http://127.0.0.1/ | head -20",
    "curl -sI -H 'Host: balitech.org' http://127.0.0.1/ | head -20",
    "curl -sI http://127.0.0.1:3005/ | head -15",
    "curl -s http://127.0.0.1:3005/blog | grep -oE '/blog/[a-z0-9-]+' | sort -u | head -20",
    "pm2 status",
    "hostname -I",
  ];
  for (const c of cmds) {
    console.log("\n##", c.slice(0, 80));
    const r = await ssh.execCommand(c);
    console.log((r.stdout || r.stderr || "").trim());
  }
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
