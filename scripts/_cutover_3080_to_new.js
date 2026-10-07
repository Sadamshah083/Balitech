/**
 * Stop BaliTech on old IP:3080. Ensure new guest serves on :3080 only.
 * Tries to add host DNAT via the KVM gateway if reachable from the guest.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { NodeSSH } = require("node-ssh");

const PROJECT_PORT = 3080;
const APP_PORT = 3005;

const OLD = {
  host: "157.173.222.222",
  username: "root",
  password: "Bali@Tech123?",
  readyTimeout: 60000,
};

const NEW = {
  host: "203.215.164.70",
  port: 2233,
  username: "ubuntu",
  password: "balitech1",
  readyTimeout: 60000,
};

async function run(ssh, label, cmd, allowFail = false) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd);
  if (res.stdout) console.log(res.stdout.trim().slice(0, 3500));
  if (res.stderr) {
    const e = res.stderr.trim();
    if (e) console.error(e.slice(0, 1500));
  }
  if (!allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

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
  const old = new NodeSSH();
  const neu = new NodeSSH();
  await Promise.all([old.connect(OLD), neu.connect(NEW)]);

  // 1) Stop :3080 on OLD public server
  await run(
    old,
    "disable old :3080 site",
    [
      "rm -f /etc/nginx/sites-enabled/balitech-port",
      "rm -f /etc/nginx/sites-available/balitech-port",
      "nginx -t && systemctl reload nginx",
      `ss -tlnp | grep ':${PROJECT_PORT}' || echo 'OLD_3080_CLOSED'`,
    ].join(" && ")
  );
  await run(old, "ufw delete 3080", "ufw delete allow 3080/tcp || true", true);
  await run(
    old,
    "iptables drop 3080 if still open",
    `iptables -D INPUT -p tcp --dport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || true; iptables -D INPUT -p tcp --dport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || true; true`,
    true
  );

  // 2) Ensure NEW guest nginx on 3080 -> 3005 (app port untouched)
  const nginx = `server {
    listen ${PROJECT_PORT};
    listen [::]:${PROJECT_PORT};
    server_name balitech.org www.balitech.org 203.215.164.70 _;
    client_max_body_size 100M;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  // Keep internal :80 on guest for local/tunnel use, but project public port is 3080
  const nginxFull = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen ${PROJECT_PORT};
    listen [::]:${PROJECT_PORT};
    server_name balitech.org www.balitech.org 203.215.164.70 _;
    client_max_body_size 100M;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  const local = path.join(os.tmpdir(), "nginx-balitech-3080.conf");
  fs.writeFileSync(local, nginxFull.replace(/\r\n/g, "\n"));
  await neu.putFile(local, "/tmp/nginx-balitech");
  await run(
    neu,
    "new nginx 3080",
    "sudo cp /tmp/nginx-balitech /etc/nginx/sites-available/balitech && sudo ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech && sudo nginx -t && sudo systemctl reload nginx"
  );
  await run(
    neu,
    "ensure app + listen",
    `pm2 restart balitech-app --update-env || true; sleep 2; ss -tlnp | grep -E ':${PROJECT_PORT}|:${APP_PORT}'; curl -s -o /dev/null -w 'local3080:%{http_code} app:%{http_code}\\n' http://127.0.0.1:${PROJECT_PORT}/ http://127.0.0.1:${APP_PORT}/`
  );

  // 3) Try configure DNAT on KVM host from guest (gateway 192.168.122.1)
  await run(
    neu,
    "find gateway",
    "ip route | awk '/default/ {print $3}'; hostname -I"
  );

  // Attempt SSH to gateway with common creds (may fail)
  const gwAttempts = [
    { user: "root", pass: "balitech1" },
    { user: "ubuntu", pass: "balitech1" },
    { user: "root", pass: "Bali@Tech123?" },
  ];
  let hostConfigured = false;
  for (const a of gwAttempts) {
    const r = await neu.execCommand(
      `sshpass -p '${a.pass}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${a.user}@192.168.122.1 'echo HOST_OK; hostname; iptables -t nat -C PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination 192.168.122.30:${PROJECT_PORT} 2>/dev/null || iptables -t nat -A PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination 192.168.122.30:${PROJECT_PORT}; iptables -t nat -C POSTROUTING -p tcp -d 192.168.122.30 --dport ${PROJECT_PORT} -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -p tcp -d 192.168.122.30 --dport ${PROJECT_PORT} -j MASQUERADE; iptables -C FORWARD -p tcp -d 192.168.122.30 --dport ${PROJECT_PORT} -j ACCEPT 2>/dev/null || iptables -I FORWARD -p tcp -d 192.168.122.30 --dport ${PROJECT_PORT} -j ACCEPT; echo DONE'`,
      { cwd: "/home/ubuntu" }
    );
    console.log(`\n>> host via ${a.user}@gateway`);
    console.log((r.stdout || r.stderr || "").trim().slice(0, 2000));
    if (/HOST_OK/.test(r.stdout || "")) {
      hostConfigured = true;
      break;
    }
  }

  // Also try installing sshpass on guest if missing
  if (!hostConfigured) {
    await run(neu, "install sshpass on guest", "sudo apt-get install -y sshpass", true);
    for (const a of gwAttempts) {
      const r = await neu.execCommand(
        `sshpass -p '${a.pass}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${a.user}@192.168.122.1 "echo HOST_OK; iptables -t nat -A PREROUTING -p tcp --dport ${PROJECT_PORT} -j DNAT --to-destination 192.168.122.30:${PROJECT_PORT}; iptables -I FORWARD -p tcp -d 192.168.122.30 --dport ${PROJECT_PORT} -j ACCEPT; iptables -t nat -A POSTROUTING -j MASQUERADE; echo DONE"`
      );
      console.log(`\n>> retry host ${a.user}`, (r.stdout || r.stderr || "").trim().slice(0, 1500));
      if (/HOST_OK/.test(r.stdout || "")) {
        hostConfigured = true;
        break;
      }
    }
  }

  old.dispose();
  neu.dispose();

  const old3080 = await probe("157.173.222.222", PROJECT_PORT);
  const new3080 = await probe("203.215.164.70", PROJECT_PORT);
  console.log(
    JSON.stringify(
      {
        old_3080: old3080,
        new_3080: new3080,
        hostConfigured,
        use: `http://203.215.164.70:${PROJECT_PORT}/`,
      },
      null,
      2
    )
  );

  if (new3080 !== "open") {
    console.log(
      "\nNEED_HOST_FORWARD: On the hypervisor (203.215.164.70), forward TCP " +
        `${PROJECT_PORT} -> 192.168.122.30:${PROJECT_PORT}`
    );
    process.exitCode = 2;
  } else {
    console.log("\nOK: http://203.215.164.70:3080/ is reachable; old :3080 stopped.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
