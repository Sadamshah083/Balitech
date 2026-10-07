/**
 * Keep the earliest published ACA/Medicare careers post; set the rest to draft.
 * Then rebuild so /blog SSG drops the duplicates.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, PROJECT_PORT, APP_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, {
    cwd: opts.cwd || SERVER.remoteDir,
    execOptions: { pty: !!opts.pty },
  });
  if (res.stdout) console.log(res.stdout.trim().slice(-5000));
  if (res.stderr) {
    const err = res.stderr.trim();
    if (err) console.error(err.slice(-2000));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  // Upload CSS fix (no sidebar scrollbar)
  await ssh.putFile(
    path.join(ROOT, "src/app/globals.css"),
    `${SERVER.remoteDir}/src/app/globals.css`
  );
  console.log(">> put globals.css");

  await run(
    ssh,
    "unpublish duplicate ACA blogs (keep one)",
    `node <<'NODE'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const rows = await p.blog.findMany({
    where: {
      status: "published",
      OR: [
        { slug: { startsWith: "aca-medicare-campaign-careers-skills-and-growth-at-balitech" } },
        { title: { contains: "ACA & Medicare Campaign" } },
      ],
    },
    orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
    select: { id: true, slug: true, title: true, publishedAt: true },
  });
  console.log("FOUND", rows.length);
  for (const r of rows) console.log(r.id, r.slug);
  if (rows.length <= 1) {
    console.log(JSON.stringify({ kept: rows[0] || null, unpublished: [] }));
    await p.$disconnect();
    return;
  }
  const keep = rows[0];
  const extras = rows.slice(1);
  for (const r of extras) {
    await p.blog.update({ where: { id: r.id }, data: { status: "draft" } });
  }
  console.log(JSON.stringify({ kept: keep, unpublished: extras.map((x) => ({ id: x.id, slug: x.slug })) }, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE`
  );

  await run(
    ssh,
    "build on server",
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { pty: true }
  );
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);

  await run(
    ssh,
    "verify /blog",
    `sleep 3; curl -s -o /dev/null -w 'blog:%{http_code}\\n' http://127.0.0.1:${PROJECT_PORT}/blog; curl -s http://127.0.0.1:${APP_PORT}/blog | tr '"' '\\n' | grep -E 'aca-medicare-campaign-careers' | sort | uniq -c; curl -s http://127.0.0.1:${APP_PORT}/blog | grep -c 'blog-filter-card__inquiry' || true`
  );

  ssh.dispose();
  console.log("\nDONE — sidebar scroll removed; duplicate ACA posts drafted (one kept).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
