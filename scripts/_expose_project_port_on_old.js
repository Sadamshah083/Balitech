/**
 * Expose BaliTech on the OLD public IP at PROJECT_PORT (default 3080),
 * proxying through the existing SSH tunnel to the NEW guest.
 * Does not change Next.js port 3005 on the new server.
 *
 * 203.215.164.70 cannot serve HTTP until the hypervisor forwards ports
 * to the guest — use 157.173.222.222:3080 or https://balitech.org instead.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");

const PROJECT_PORT = Number(process.env.BALITECH_PROJECT_PORT || 3080);
const TUNNEL = 3006;

const OLD = {
  host: "157.173.222.222",
  username: "root",
  password: "Bali@Tech123?",
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
  await ssh.connect(OLD);

  await run(ssh, "tunnel up", "systemctl restart balitech-tunnel; sleep 2; systemctl is-active balitech-tunnel");
  await run(ssh, "nginx up", "systemctl start nginx; systemctl is-active nginx");

  const conf = `server {
    listen ${PROJECT_PORT};
    listen [::]:${PROJECT_PORT};
    server_name _;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:${TUNNEL};
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
  const local = path.join(os.tmpdir(), "balitech-port.conf");
  fs.writeFileSync(local, conf.replace(/\r\n/g, "\n"));
  await ssh.putFile(local, "/etc/nginx/sites-available/balitech-port");
  await run(
    ssh,
    "enable port site",
    "ln -sfn /etc/nginx/sites-available/balitech-port /etc/nginx/sites-enabled/balitech-port && nginx -t && systemctl reload nginx"
  );
  await run(
    ssh,
    "listen check",
    `ss -tlnp | grep ':${PROJECT_PORT}'; curl -s -o /dev/null -w 'local:%{http_code}\\n' http://127.0.0.1:${PROJECT_PORT}/`
  );

  ssh.dispose();

  const { execSync } = require("child_process");
  try {
    const out = execSync(
      `curl.exe -sI http://157.173.222.222:${PROJECT_PORT}/`,
      { encoding: "utf8", timeout: 20000 }
    );
    console.log("\npublic check:\n" + out.split("\n").slice(0, 8).join("\n"));
  } catch (e) {
    console.log("public check failed", e.message);
  }

  console.log(`\nOPEN: http://157.173.222.222:${PROJECT_PORT}/`);
  console.log("Also: https://balitech.org/");
  console.log("203.215.164.70 will refuse until host DNAT: 3080 -> 192.168.122.30:3080");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
