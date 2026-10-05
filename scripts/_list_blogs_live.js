const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const REMOTE_JS = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const blogs = await prisma.blog.findMany({
    select: { slug: true, title: true, categoryId: true, category: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log(JSON.stringify(blogs, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
`;

async function main() {
  const localTmp = path.join(os.tmpdir(), "balitech-list-blogs.js");
  const remoteTmp = "/tmp/balitech-list-blogs.js";
  fs.writeFileSync(localTmp, REMOTE_JS, "utf8");
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  try {
    await ssh.putFile(localTmp, remoteTmp);
    const res = await ssh.execCommand(
      `NODE_PATH=${SERVER.remoteDir}/node_modules node ${remoteTmp}`,
      { cwd: SERVER.remoteDir }
    );
    if (res.stdout) console.log(res.stdout.trim());
    if (res.stderr) console.error(res.stderr.trim());
    if (res.code !== 0) process.exit(res.code || 1);
  } finally {
    await ssh.execCommand(`rm -f ${remoteTmp}`);
    ssh.dispose();
    fs.unlinkSync(localTmp);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
