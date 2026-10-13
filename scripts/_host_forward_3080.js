/**
 * From the KVM guest, open host DNAT as ateg with sudo:
 *   public 203.215.164.70:3080 → guest 192.168.122.30:3080
 */
const net = require("net");
const { NodeSSH } = require("node-ssh");
const { SERVER, PROJECT_PORT } = require("./deploy-config");

const GUEST_LAN = "192.168.122.30";
const HOST_USER = "ateg";
const HOST_PASS = SERVER.password || "balitech1";

function probe(host, port, ms = 8000) {
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

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  await ssh.execCommand(
    "command -v sshpass >/dev/null || (echo balitech1 | sudo -S apt-get install -y sshpass)"
  );

  const remote = [
    "echo HOST_OK",
    "hostname",
    // Use sudo -S for iptables on the hypervisor
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -C PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination ${GUEST_LAN}:${PROJECT_PORT} 2>/dev/null || echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -A PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination ${GUEST_LAN}:${PROJECT_PORT}`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -C POSTROUTING -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j MASQUERADE 2>/dev/null || echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -A POSTROUTING -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j MASQUERADE`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -C FORWARD -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -I FORWARD -p tcp -d ${GUEST_LAN} --dport ${PROJECT_PORT} -j ACCEPT`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -C FORWARD -p tcp -s ${GUEST_LAN} --sport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -I FORWARD -p tcp -s ${GUEST_LAN} --sport ${PROJECT_PORT} -j ACCEPT`,
    // Open host firewall if ufw is active
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S ufw allow ${PROJECT_PORT}/tcp >/dev/null 2>&1 || true`,
    `echo ${JSON.stringify(HOST_PASS)} | sudo -S iptables -t nat -L PREROUTING -n | grep ${PROJECT_PORT} || true`,
    "echo DONE",
  ].join("; ");

  const cmd = `sshpass -p ${JSON.stringify(HOST_PASS)} ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 ${HOST_USER}@192.168.122.1 ${JSON.stringify(remote)}`;

  console.log(`>> DNAT via ${HOST_USER}@gateway → ${GUEST_LAN}:${PROJECT_PORT}`);
  const r = await ssh.execCommand(cmd);
  console.log(`${r.stdout || ""}\n${r.stderr || ""}`.trim().slice(0, 2500));

  ssh.dispose();

  // Give iptables a moment
  await new Promise((res) => setTimeout(res, 1500));
  const publicStatus = await probe(SERVER.host, PROJECT_PORT, 10000);
  console.log(
    JSON.stringify(
      {
        public: `${SERVER.host}:${PROJECT_PORT}`,
        status: publicStatus,
        url: `http://${SERVER.host}:${PROJECT_PORT}/`,
      },
      null,
      2
    )
  );

  if (publicStatus !== "open") {
    console.log("\nHost DNAT may still be blocked by another firewall layer.");
    process.exitCode = 2;
  } else {
    console.log(`\nOK http://${SERVER.host}:${PROJECT_PORT}/`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
