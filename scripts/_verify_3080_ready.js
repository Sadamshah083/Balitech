const { NodeSSH } = require("node-ssh");
const net = require("net");

function probe(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const t = setTimeout(() => {
      s.destroy();
      resolve("timeout");
    }, timeoutMs);
    s.on("connect", () => {
      clearTimeout(t);
      s.end();
      resolve("open");
    });
    s.on("error", (e) => {
      clearTimeout(t);
      resolve(e.code || "error");
    });
  });
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "203.215.164.70",
    port: 2233,
    username: "ubuntu",
    password: "balitech1",
    readyTimeout: 60000,
  });

  const r = await ssh.execCommand(
    [
      "ss -tlnp | grep -E ':3080|:3005' || true",
      "echo ---",
      "curl -s -o /dev/null -w 'guest3080:%{http_code}\\n' http://127.0.0.1:3080/",
      "curl -s -o /dev/null -w 'app3005:%{http_code}\\n' http://127.0.0.1:3005/",
      "echo ---",
      "grep -n listen /etc/nginx/sites-enabled/balitech | head -20",
      "pm2 jlist | python3 -c \"import sys,json; d=json.load(sys.stdin); print(d[0]['name'], d[0]['pm2_env']['status'], d[0]['pid'])\"",
    ].join(" && ")
  );
  console.log((r.stdout || r.stderr || "").trim());
  ssh.dispose();

  console.log("public old 157:3080", await probe("157.173.222.222", 3080));
  console.log("public new 203:3080", await probe("203.215.164.70", 3080));
  console.log("READY: guest listens 3080 -> 3005. Forward host 3080 -> 192.168.122.30:3080");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
