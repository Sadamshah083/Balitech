/**
 * If the live Blog table is empty, copy the local published posts (or seed defaults).
 * Does not overwrite existing live rows.
 *
 *   node scripts/_sync_blogs_to_live.js
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ssh = new NodeSSH();

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const local = new PrismaClient();
  let rows = await local.blog.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  await local.$disconnect();

  if (rows.length === 0) {
    console.log("Local has no published blogs; nothing to sync.");
    return;
  }

  await ssh.connect(SERVER);

  const payload = JSON.stringify(
    rows.map((b) => ({
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      image: b.image,
      tags: b.tags,
      format: b.format,
      order: b.order,
      isPublished: b.isPublished,
    }))
  );

  const remoteScript = `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const rows = ${payload};
(async () => {
  const count = await prisma.blog.count();
  if (count > 0) {
    console.log(JSON.stringify({ skipped: true, count }));
    await prisma.$disconnect();
    return;
  }
  for (const row of rows) {
    await prisma.blog.create({ data: row });
  }
  console.log(JSON.stringify({ inserted: rows.length }));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
`;

  await ssh.execCommand("npx prisma generate", { cwd: SERVER.remoteDir });

  const remotePath = `${SERVER.remoteDir}/_sync_blogs_tmp.js`;
  await ssh.putFile(
    (() => {
      const fs = require("fs");
      const tmp = path.join(__dirname, "_sync_blogs_tmp.js");
      fs.writeFileSync(tmp, remoteScript);
      return tmp;
    })(),
    remotePath
  );

  const run = await ssh.execCommand("node _sync_blogs_tmp.js", {
    cwd: SERVER.remoteDir,
  });
  console.log(run.stdout || run.stderr);
  if (run.code !== 0) throw new Error(run.stderr || "sync failed");
  await ssh.execCommand("rm -f _sync_blogs_tmp.js", { cwd: SERVER.remoteDir });
  try {
    require("fs").unlinkSync(path.join(__dirname, "_sync_blogs_tmp.js"));
  } catch {}
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => ssh.dispose());
