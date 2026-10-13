/**
 * Revert the port-3080 enablement:
 * - remove host DNAT 203.215.164.70:3080 → guest:3080
 * - stop nginx / disable balitech site (back to app-only on :3005)
 */
const net = require("net");
const { NodeSSH } = require("node-ssh");
const { SERVER, PROJECT_PORT, APP_PORT } = require("./deploy-config");

const GUEST_LAN = "192.168.122.30";
const HOST_USER = "ateg";
const HOST_PASS = SERVER.password || "balitech1";

function probe(host, port, ms = 6000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve("open");
    });
    socket.on("error", () => resolve("closed"));
    socket.setTimeout(ms, () => {
      socket.destroy();
      resolve("timeout");
    });
  });
}

function sudo(cmd) {
  const pass = SERVER.password || "";
  return `sudo -n ${cmd} 2>/dev/null || echo ${JSON.stringify(pass)} | sudo -S ${cmd}`;
}

async function main() {
  console.log(`Revert public port ${PROJECT_PORT}`);
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  await ssh.execCommand(
    "command -v sshpass >/dev/null || (echo balitech1 | sudo -S apt-get install -y sshpass)"
  );

  // 1) Remove host DNAT / FORWARD rules (repeat delete until gone)
  const hostRemote = [
    "echo HOST_OK",
    "hostname",
    `for i in 1 2 3 4 5; do echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -D PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination ${GUEST_LAN}:${PROJECT_PORT} 2>/dev/null || break; done`,
    `for i in 1 2 3 4 5; do echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -D POSTROUTING -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j MASQUERADE 2>/dev/null || break; done`,
    `for i in 1 2 3 4 5; do echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -D FORWARD -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || break; done`,
    `for i in 1 2 3 4 5; do echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -D FORWARD -p tcp -s ${GUEST_LAN} --sport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || break; done`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S ufw delete allow ${PROJECT_PORT}/tcp >/dev/null 2>&1 || true`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -L PREROUTING -n | grep ${PROJECT_PORT} || echo 'HOST_3080_DNAT_GONE'`,
    "echo DONE",
  ].join("; ");

  console.log("\n>> remove host DNAT");
  const host = await ssh.execCommand(
    `sshpass -p ${JSON.stringify(HOST_PASS)} ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 ${HOST_USER}@192.168.122.1 ${JSON.stringify(hostRemote)}`
  );
  console.log(`${host.stdout || ""}\n${host.stderr || ""}`.trim().slice(0, 2000));

  // 2) Stop nginx on guest (previous state: inactive, no sites-enabled)
  console.log("\n>> stop nginx + disable site");
  const nginxCmds = [
    `${sudo("rm -f /etc/nginx/sites-enabled/balitech")}`,
    `${sudo("systemctl stop nginx")}`,
    `${sudo("systemctl disable nginx")}`,
  ].join(" && ");
  const n = await ssh.execCommand(nginxCmds, { execOptions: { pty: true } });
  console.log(`${n.stdout || ""}\n${n.stderr || ""}`.trim().slice(0, 1500));

  const ports = await ssh.execCommand(
    "ss -lntp | grep -E ':(80|3080|3005)\\b' || true; systemctl is-active nginx || true"
  );
  console.log("\n>> guest ports\n", (ports.stdout || "").trim());

  const app = await ssh.execCommand(
    `curl -s -o /dev/null -w 'app_${APP_PORT}:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/`
  );
  console.log((app.stdout || "").trim());

  ssh.dispose();

  await new Promise((r) => setTimeout(r, 1000));
  const publicStatus = await probe(SERVER.host, PROJECT_PORT, 8000);
  console.log(
    JSON.stringify(
      {
        public3080: publicStatus,
        note: "App remains on :3005 via pm2; public :3080 reverted",
      },
      null,
      2
    )
  );
  console.log("\nOK reverted port 3080 setup");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
