/**
 * Prepare the new Ubuntu server: Node 20, MySQL, nginx, pm2, app dirs.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");

const NEW = {
  host: process.env.BALITECH_SSH_HOST || "203.215.164.70",
  port: Number(process.env.BALITECH_SSH_PORT || 2233),
  username: process.env.BALITECH_SSH_USER || "ubuntu",
  password: process.env.BALITECH_SSH_PASSWORD || "balitech1",
  readyTimeout: 180000,
  keepaliveInterval: 5000,
  keepaliveCountMax: 60,
};

async function run(ssh, label, cmd) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, { cwd: "/home/ubuntu" });
  if (res.stdout) console.log(res.stdout.trim());
  if (res.stderr) console.error(res.stderr.trim());
  if (res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed with code ${res.code}`);
  }
  return res;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(NEW);
  console.log("Connected to", NEW.host);

  await run(ssh, "apt update", "sudo DEBIAN_FRONTEND=noninteractive apt-get update -y");
  await run(
    ssh,
    "base packages",
    "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg rsync unzip"
  );

  // Node 20 via NodeSource
  await run(
    ssh,
    "nodesource",
    "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  );
  await run(
    ssh,
    "install node",
    "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs"
  );
  await run(ssh, "node versions", "node -v && npm -v");

  await run(
    ssh,
    "install mysql nginx certbot",
    "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server nginx certbot python3-certbot-nginx"
  );
  await run(ssh, "install pm2", "sudo npm install -g pm2");
  await run(ssh, "pm2 version", "pm2 -v");

  await run(
    ssh,
    "app dirs",
    "sudo mkdir -p /var/www/balitech-app/uploads/cvs && sudo chown -R ubuntu:ubuntu /var/www/balitech-app"
  );

  await run(ssh, "enable services", "sudo systemctl enable mysql nginx && sudo systemctl start mysql nginx");

  // Create DB + user
  const sql = [
    "CREATE DATABASE IF NOT EXISTS balitech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "CREATE USER IF NOT EXISTS 'balitech_user'@'localhost' IDENTIFIED BY 'BaliTechDB_2026!';",
    "ALTER USER 'balitech_user'@'localhost' IDENTIFIED BY 'BaliTechDB_2026!';",
    "GRANT ALL PRIVILEGES ON balitech_db.* TO 'balitech_user'@'localhost';",
    "FLUSH PRIVILEGES;",
  ].join(" ");
  await run(ssh, "create database", `sudo mysql -e ${JSON.stringify(sql)}`);

  await run(
    ssh,
    "verify",
    "node -v; npm -v; pm2 -v; mysql --version | head -1; nginx -v 2>&1; ls -ld /var/www/balitech-app; mysql -ubalitech_user -p'BaliTechDB_2026!' -e 'SHOW DATABASES;'"
  );

  console.log("\nPREP_OK");
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
