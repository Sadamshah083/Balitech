/**
 * Define a dedicated public HTTP port for BaliTech on the new guest.
 * Does NOT change the running Next.js port (3005).
 *
 * Guest nginx listens on PROJECT_PORT and proxies to 127.0.0.1:3005.
 * Host/hypervisor must DNAT: 203.215.164.70:PROJECT_PORT -> 192.168.122.30:PROJECT_PORT
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");

/** Dedicated port for this project — not 80/443/8080/2233 (host services / SSH). */
const PROJECT_PORT = Number(process.env.BALITECH_PROJECT_PORT || 3080);
const APP_PORT = 3005; // running Next.js — do not change

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
  if (res.stdout) console.log(res.stdout.trim().slice(0, 3000));
  if (res.stderr) {
    const e = res.stderr.trim();
    if (e) console.error(e.slice(0, 1500));
  }
  if (!allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(NEW);

  // Confirm app still on 3005
  await run(
    ssh,
    "check running app port",
    `ss -tlnp | grep -E ':${APP_PORT}|:80 |:${PROJECT_PORT}' || true; curl -s -o /dev/null -w 'app3005:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/`
  );

  const nginx = `server {
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
  const local = path.join(os.tmpdir(), "nginx-balitech-port.conf");
  fs.writeFileSync(local, nginx.replace(/\r\n/g, "\n"));
  await ssh.putFile(local, "/tmp/nginx-balitech");
  await run(
    ssh,
    "install nginx config",
    "sudo cp /tmp/nginx-balitech /etc/nginx/sites-available/balitech && sudo ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech && sudo nginx -t && sudo systemctl reload nginx"
  );

  // Open firewall for project port only (leave other rules alone)
  await run(ssh, "ufw allow project port", `sudo ufw allow ${PROJECT_PORT}/tcp comment 'BaliTech public' || true`, true);
  await run(ssh, "ufw status", "sudo ufw status || true", true);

  await run(
    ssh,
    "verify local ports",
    `ss -tlnp | grep -E ':${APP_PORT}|:${PROJECT_PORT}|:80 '; curl -s -o /dev/null -w 'via3080:%{http_code} ' http://127.0.0.1:${PROJECT_PORT}/; curl -s -o /dev/null -w 'via3005:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/`
  );

  // Persist port choice on the server
  await run(
    ssh,
    "write port marker",
    `printf '%s\\n' 'BALITECH_PROJECT_PORT=${PROJECT_PORT}' 'BALITECH_APP_PORT=${APP_PORT}' > /var/www/balitech-app/PROJECT_PORTS.txt && cat /var/www/balitech-app/PROJECT_PORTS.txt`
  );

  ssh.dispose();

  // Probe from outside (will only work after host DNAT)
  const net = require("net");
  await new Promise((resolve) => {
    const s = net.connect({ host: "203.215.164.70", port: PROJECT_PORT }, () => {
      console.log(`\npublic ${PROJECT_PORT}: open`);
      s.end();
      resolve();
    });
    s.on("error", (e) => {
      console.log(`\npublic ${PROJECT_PORT}: ${e.code} (host must forward ${PROJECT_PORT} -> 192.168.122.30:${PROJECT_PORT})`);
      resolve();
    });
    setTimeout(() => {
      s.destroy();
      resolve();
    }, 3000);
  });

  console.log(`\nDONE`);
  console.log(`App (unchanged): 127.0.0.1:${APP_PORT}`);
  console.log(`Project public port: ${PROJECT_PORT}`);
  console.log(`URL after host forward: http://203.215.164.70:${PROJECT_PORT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
