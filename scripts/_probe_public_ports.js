const net = require("net");

function probe(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const t = setTimeout(() => {
      socket.destroy();
      resolve({ port, status: "timeout" });
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(t);
      socket.end();
      resolve({ port, status: "open" });
    });
    socket.on("error", (e) => {
      clearTimeout(t);
      resolve({ port, status: e.code || "error" });
    });
  });
}

async function main() {
  const host = "203.215.164.70";
  const ports = [22, 80, 443, 2233, 3005, 8080, 8443, 8000, 3000, 2080, 20800];
  for (const port of ports) {
    const r = await probe(host, port);
    console.log(port, r.status);
  }
}

main();
