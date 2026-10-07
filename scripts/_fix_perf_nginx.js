/**
 * Re-enable nginx for Balitech with compression, long cache for static assets,
 * and security headers. Does not change app content or design.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER, APP_PORT, PROJECT_PORT } = require("./deploy-config");

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
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    add_header X-DNS-Prefetch-Control "on" always;

    # Immutable hashed Next assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location ~* \\.(?:js|css|woff2|woff|ttf|otf|ico|png|jpg|jpeg|gif|webp|avif|svg|mp4|webm)$ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        add_header X-Content-Type-Options "nosniff" always;
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

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const r = await ssh.execCommand(cmd, { execOptions: { pty: !!opts.pty } });
  if (r.stdout) console.log(r.stdout.trim().slice(-3000));
  if (r.stderr && r.stderr.trim()) console.error(r.stderr.trim().slice(-1500));
  if (!opts.allowFail && r.code !== 0 && r.code !== null) {
    throw new Error(`${label} failed (${r.code})`);
  }
  return r;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  // Write config via base64 to avoid shell quoting issues
  const b64 = Buffer.from(NGINX_CONF).toString("base64");
  await run(
    ssh,
    "write nginx site",
    `echo '${b64}' | base64 -d | sudo tee /etc/nginx/sites-available/balitech > /dev/null`
  );
  await run(
    ssh,
    "enable site",
    "sudo ln -sfn /etc/nginx/sites-available/balitech /etc/nginx/sites-enabled/balitech && sudo rm -f /etc/nginx/sites-enabled/default"
  );
  await run(ssh, "nginx -t", "sudo nginx -t");
  await run(ssh, "reload nginx", "sudo systemctl enable nginx; sudo systemctl restart nginx");
  await run(
    ssh,
    "verify ports",
    "ss -lntp | grep -E ':(80|3080|3005)\\b' || true"
  );
  await run(
    ssh,
    "verify via nginx 3080",
    `curl -sI http://127.0.0.1:${PROJECT_PORT}/ | head -25; echo ---; curl -s http://127.0.0.1:${PROJECT_PORT}/ | head -c 200`
  );

  ssh.dispose();
  console.log("\nOK nginx restored on :80 and :" + PROJECT_PORT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
