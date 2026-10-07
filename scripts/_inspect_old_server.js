const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  const cmds = [
    "node -v; npm -v; pm2 -v; mysql --version 2>/dev/null | head -1",
    "ls -la /var/www/balitech-app | head -30",
    "du -sh /var/www/balitech-app/.next /var/www/balitech-app/public /var/www/balitech-app/uploads /var/www/balitech-app/node_modules 2>/dev/null",
    "grep -E '^(DATABASE_URL|JWT_|NEXT_PUBLIC_|SMTP_|CRM_|ADMIN_|PORT)=' /var/www/balitech-app/.env | sed -E 's/(PASSWORD|PASS|SECRET|TOKEN)=.*/\\1=***/'",
    "grep '^DATABASE_URL' /var/www/balitech-app/.env",
    "ls /etc/nginx/sites-enabled 2>/dev/null; ls /etc/nginx/conf.d 2>/dev/null",
    "grep -E 'server_name|proxy_pass|listen |root ' /etc/nginx/sites-enabled/* /etc/nginx/conf.d/* 2>/dev/null | head -100",
  ];
  for (const c of cmds) {
    const r = await ssh.execCommand(c, { cwd: "/var/www/balitech-app" });
    console.log("\n##", c.slice(0, 90));
    console.log((r.stdout || r.stderr || "").trim());
  }

  const countJs = `
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
Promise.all([
  p.blog.count(),
  p.campaign.count(),
  p.office.count(),
  p.lead.count(),
  p.blogCategory.count(),
  p.blogTag.count(),
  p.mediaItem.count(),
  p.admin.count(),
  p.vacancy.count(),
])
  .then((a) => {
    console.log(JSON.stringify({
      blogs: a[0], campaigns: a[1], offices: a[2], leads: a[3],
      categories: a[4], tags: a[5], media: a[6], admins: a[7], vacancies: a[8],
    }));
    return p.$disconnect();
  })
  .catch(async (e) => { console.error(String(e)); await p.$disconnect(); process.exit(1); });
`;
  const remote = "/tmp/balitech-counts.js";
  await ssh.putFile(
    (() => {
      const fs = require("fs");
      const os = require("os");
      const path = require("path");
      const local = path.join(os.tmpdir(), "balitech-counts.js");
      fs.writeFileSync(local, countJs);
      return local;
    })(),
    remote
  );
  const counts = await ssh.execCommand(
    `NODE_PATH=/var/www/balitech-app/node_modules node ${remote}`,
    { cwd: "/var/www/balitech-app" }
  );
  console.log("\n## COUNTS");
  console.log((counts.stdout || counts.stderr || "").trim());
  await ssh.execCommand(`rm -f ${remote}`);
  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
