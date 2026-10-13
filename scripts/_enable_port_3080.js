/**
 * Ensure Balitech is reachable on PROJECT_PORT (3080):
 * - nginx listens on 3080 (and 80)
 * - proxies to Next.js on APP_PORT (3005)
 * - pm2 app stays on 3005
 */
const { NodeSSH } = require("node-ssh");
const { SERVER, APP_PORT, PROJECT_PORT, PM2_APP } = require("./deploy-config");

const NGINX_CONF = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen ${PROJECT_PORT};
    listen [::]:${PROJECT_PORT};
    server_name balitech.org www.balitech.org 203.215.164.70 _;

    client_max_body_size 100M;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        application/rss+xml
        image/svg+xml
        font/woff2;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

function sudo(cmd) {
  const pass = SERVER.password || "";
  // Prefer passwordless; fall back to -S with deploy password.
  return `sudo -n ${cmd} 2>/dev/null || echo ${JSON.stringify(pass)} | sudo -S ${cmd}`;
}

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const r = await ssh.execCommand(cmd, { execOptions: { pty: !!opts.pty } });
  if (r.stdout) console.log(r.stdout.trim().slice(-3500));
  if (r.stderr && r.stderr.trim()) console.error(r.stderr.trim().slice(-1200));
  if (!opts.allowFail && r.code !== 0 && r.code !== null) {
    throw new Error(`${label} failed (${r.code})`);
  }
  return r;
}

async function main() {
  console.log(
    `Enable public port ${PROJECT_PORT} → app ${APP_PORT} (${PM2_APP})`
  );
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  // Keep Next on APP_PORT; only expose PROJECT_PORT via nginx.
  await run(
    ssh,
    "pm2 status",
    `pm2 describe ${PM2_APP} | grep -E 'status|script args|PORT' || pm2 list`
  );

  const b64 = Buffer.from(NGINX_CONF).toString("base64");
  await run(
    ssh,
    "write nginx balitech site",
    `echo '${b64}' | base64 -d | ${sudo("tee /etc/nginx/sites-available/balitech > /dev/null")}`,
    { pty: true }
  );
  await run(
    ssh,
    "enable site + remove default",
    `${sudo("ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech")} && ${sudo("rm -f /etc/nginx/sites-enabled/default")}`,
    { pty: true }
  );
  await run(ssh, "nginx -t", sudo("nginx -t"), { pty: true });
  await run(
    ssh,
    "enable + start nginx",
    `${sudo("systemctl enable nginx")} && ${sudo("systemctl restart nginx")}`,
    { pty: true }
  );

  await run(
    ssh,
    "listening ports",
    "ss -lntp | grep -E ':(80|3080|3005)\\b' || true"
  );
  await run(
    ssh,
    "verify local 3080",
    `curl -s -o /dev/null -w 'app:${APP_PORT}=%{http_code} nginx:${PROJECT_PORT}=%{http_code} nginx80=%{http_code}\\n' http://127.0.0.1:${APP_PORT}/ http://127.0.0.1:${PROJECT_PORT}/ http://127.0.0.1/`
  );

  ssh.dispose();
  console.log(
    `\nOK Balitech public port ${PROJECT_PORT}: http://${SERVER.host}:${PROJECT_PORT}/`
  );
  console.log(
    `(App still binds ${APP_PORT} internally; nginx on ${PROJECT_PORT} proxies to it.)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
