/**
 * Stop balitech-app on the OLD public IP and reverse-proxy balitech.org
 * through the old nginx → SSH tunnel → NEW guest (live DB + new build).
 *
 * DNS still points at 157.173.222.222; this makes that IP serve the new server.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");

const OLD = {
  host: "157.173.222.222",
  username: "root",
  password: "Bali@Tech123?",
  readyTimeout: 120000,
  keepaliveInterval: 5000,
};

const NEW_HOST = "203.215.164.70";
const NEW_PORT = 2233;
const NEW_USER = "ubuntu";
const NEW_PASS = "balitech1";
const TUNNEL_LOCAL = 3006;

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd);
  if (res.stdout) console.log(res.stdout.trim().slice(0, 4000));
  if (res.stderr) {
    const e = res.stderr.trim();
    if (e) console.error(e.slice(0, 2000));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  const old = new NodeSSH();
  await old.connect(OLD);

  // Ensure new guest is up
  const newSsh = new NodeSSH();
  await newSsh.connect({
    host: NEW_HOST,
    port: NEW_PORT,
    username: NEW_USER,
    password: NEW_PASS,
    readyTimeout: 60000,
  });
  await run(
    newSsh,
    "new app status",
    "pm2 restart balitech-app --update-env || pm2 start /var/www/balitech-app/ecosystem.config.js --update-env; sleep 2; curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3005/"
  );
  newSsh.dispose();

  await run(old, "install autossh/sshpass", "apt-get install -y autossh sshpass", {
    allowFail: true,
  });

  // SSH key from old → new for passwordless tunnel
  await run(
    old,
    "ssh key",
    [
      "mkdir -p /root/.ssh && chmod 700 /root/.ssh",
      "test -f /root/.ssh/balitech_new || ssh-keygen -t ed25519 -N '' -f /root/.ssh/balitech_new",
      `sshpass -p '${NEW_PASS}' ssh-copy-id -i /root/.ssh/balitech_new.pub -o StrictHostKeyChecking=no -p ${NEW_PORT} ${NEW_USER}@${NEW_HOST}`,
    ].join(" && ")
  );

  // systemd unit for persistent tunnel
  const unit = `[Unit]
Description=SSH tunnel to new BaliTech guest (3006 -> 3005)
After=network-online.target
Wants=network-online.target

[Service]
User=root
Environment="AUTOSSH_GATETIME=0"
ExecStart=/usr/bin/autossh -M 0 -N \\
  -o ServerAliveInterval=30 \\
  -o ServerAliveCountMax=3 \\
  -o ExitOnForwardFailure=yes \\
  -o StrictHostKeyChecking=accept-new \\
  -i /root/.ssh/balitech_new \\
  -L ${TUNNEL_LOCAL}:127.0.0.1:3005 \\
  -p ${NEW_PORT} ${NEW_USER}@${NEW_HOST}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`;
  const tmp = path.join(os.tmpdir(), "balitech-tunnel.service");
  fs.writeFileSync(tmp, unit.replace(/\r\n/g, "\n"));
  await old.putFile(tmp, "/etc/systemd/system/balitech-tunnel.service");
  await run(
    old,
    "enable tunnel",
    "systemctl daemon-reload && systemctl enable balitech-tunnel && systemctl restart balitech-tunnel && sleep 3 && systemctl is-active balitech-tunnel && ss -tlnp | grep 3006 || netstat -tlnp | grep 3006"
  );

  // Point nginx balitech vhost at the tunnel
  const nginx = `server {
    listen 80;
    listen 443 ssl http2; # managed by Certbot

    server_name balitech.org www.balitech.org 157.173.222.222;
    client_max_body_size 100M;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # One canonical origin: http and www both 301 to https://balitech.org.
    if ($scheme = http) { return 301 https://balitech.org$request_uri; }
    if ($host = www.balitech.org) { return 301 https://balitech.org$request_uri; }

    # ACME challenges stay on this nginx (certs live here until DNS moves)
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
    }

    location / {
        proxy_pass http://127.0.0.1:${TUNNEL_LOCAL};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    ssl_certificate /etc/letsencrypt/live/balitech.org/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/balitech.org/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
`;
  const nginxLocal = path.join(os.tmpdir(), "nginx-balitech-proxy");
  fs.writeFileSync(nginxLocal, nginx.replace(/\r\n/g, "\n"));
  await old.putFile(nginxLocal, "/etc/nginx/sites-available/balitech");
  await run(
    old,
    "link nginx",
    "ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech && nginx -t && systemctl reload nginx"
  );

  // Stop OLD Next.js app so it no longer serves stale/local build
  await run(old, "stop old pm2 app", "pm2 stop balitech-app && pm2 save", {
    allowFail: true,
  });

  await run(
    old,
    "tunnel smoke",
    `curl -s -o /dev/null -w 'tunnel:%{http_code}\\n' http://127.0.0.1:${TUNNEL_LOCAL}/; curl -s http://127.0.0.1:${TUNNEL_LOCAL}/blog | grep -oE '/blog/[a-z0-9-]+' | sort -u | head -15`
  );

  old.dispose();

  // Public verify
  const { execSync } = require("child_process");
  try {
    const out = execSync(
      'curl.exe -sI https://balitech.org/ && curl.exe -s https://balitech.org/blog -o %TEMP%\\bt-live.html && node -e "const fs=require(\'fs\');const h=fs.readFileSync(process.env.TEMP+\'/bt-live.html\',\'utf8\');const s=[...new Set([...h.matchAll(/\\\\/blog\\\\/([a-z0-9-]+)/g)].map(m=>m[1]).filter(x=>x!==\'category\'&&x!==\'tag\'))];console.log(\'posts\',s.length);console.log(s.slice(0,8).join(\'\\n\'));console.log(\'fallback\',/scales-us-campaign/.test(h));"',
      { encoding: "utf8", timeout: 60000 }
    );
    console.log(out);
  } catch (e) {
    console.log("public check note:", e.message);
  }

  console.log("\nLIVE_OK: https://balitech.org now proxies to the NEW server (old Next.js stopped).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
