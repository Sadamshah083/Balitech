/**
 * Mirrors the LIVE campaign list into the LOCAL development database.
 *
 *   node scripts/_mirror_campaigns_to_local.js [--apply]
 *
 * Direction is one-way and deliberate: the live table is read over SSH and is
 * never modified, and every write here targets the local .env DATABASE_URL.
 *
 * Why this exists: release builds prerender from the local database, so if its
 * campaign rows differ from live the page ships one list and then visibly
 * swaps to another when the rail re-reads the live API after paint. Aligning
 * the local rows removes that flash. It is a development-side convenience, not
 * a substitute for the live database being the source of truth.
 *
 * Runs as a dry run unless --apply is passed.
 */
const fs = require("fs");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const APPLY = process.argv.includes("--apply");

const REMOTE_READ = `
  const fs = require("fs");
  const path = require("path");
  const root = ${JSON.stringify(SERVER.remoteDir)};
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split("\\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
  const { PrismaClient } = require(path.join(root, "node_modules", "@prisma", "client"));
  const prisma = new PrismaClient();
  prisma.campaign
    .findMany({ orderBy: { order: "asc" } })
    .then((rows) => {
      process.stdout.write("@@JSON@@" + JSON.stringify(rows));
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      process.stderr.write(String(e.message || e));
      await prisma.$disconnect();
      process.exit(1);
    });
`;

function localDatabaseUrl() {
  const line = fs
    .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"));
  if (!line) throw new Error("DATABASE_URL missing from local .env");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

(async () => {
  const url = localDatabaseUrl();
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error(
      `Refusing to run: local DATABASE_URL points at "${host}", not this machine.`
    );
  }

  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  let liveRows;
  try {
    const b64 = Buffer.from(REMOTE_READ, "utf8").toString("base64");
    const res = await ssh.execCommand(
      `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_m.cjs && node /tmp/_m.cjs; rm -f /tmp/_m.cjs`
    );
    const i = res.stdout.indexOf("@@JSON@@");
    if (i === -1) throw new Error("live read failed: " + (res.stdout || res.stderr).slice(0, 300));
    liveRows = JSON.parse(res.stdout.slice(i + 8).trim());
  } finally {
    ssh.dispose();
  }

  process.env.DATABASE_URL = url;
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const localRows = await prisma.campaign.findMany({ orderBy: { order: "asc" } });
    const liveIds = new Set(liveRows.map((r) => r.id));
    const localIds = new Set(localRows.map((r) => r.id));

    const toRemove = localRows.filter((r) => !liveIds.has(r.id));
    const toAdd = liveRows.filter((r) => !localIds.has(r.id));
    const toUpdate = liveRows.filter((r) => localIds.has(r.id));

    console.log(`\nlive ${liveRows.length} rows, local ${localRows.length} rows\n`);
    console.log(`  remove from local: ${toRemove.length}`);
    for (const r of toRemove) console.log(`     - ${r.title}`);
    console.log(`  add to local:      ${toAdd.length}`);
    for (const r of toAdd) console.log(`     + ${r.title}`);
    console.log(`  refresh in local:  ${toUpdate.length}`);

    if (!APPLY) {
      console.log("\ndry run — pass --apply to write to the local database\n");
      return;
    }

    /* Backed up first so the previous local state can be restored. */
    const backup = path.join(__dirname, "..", "tmp", `local-campaigns-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, JSON.stringify(localRows, null, 2));
    console.log(`\nlocal rows backed up to ${path.relative(process.cwd(), backup)}`);

    for (const r of toRemove) await prisma.campaign.delete({ where: { id: r.id } });
    for (const r of toAdd) {
      await prisma.campaign.create({
        data: {
          id: r.id,
          title: r.title,
          description: r.description,
          icon: r.icon,
          location: r.location,
          order: r.order,
          isActive: r.isActive,
        },
      });
    }
    for (const r of toUpdate) {
      await prisma.campaign.update({
        where: { id: r.id },
        data: {
          title: r.title,
          description: r.description,
          icon: r.icon,
          location: r.location,
          order: r.order,
          isActive: r.isActive,
        },
      });
    }

    const after = await prisma.campaign.count();
    console.log(`local campaign rows now: ${after}\n`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
