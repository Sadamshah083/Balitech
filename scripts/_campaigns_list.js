/**
 * Read-only listing of the live Campaign table.
 *
 *   node scripts/_campaigns_list.js [--json]
 *
 * The query runs on the server through the deployed app's own Prisma client and
 * its own .env, so the connection string is never re-serialised (round-tripping
 * it through URL() mangles the password) and no port needs opening. Only SELECT
 * is issued.
 *
 * Use this before any destructive change: the admin table in a screenshot may be
 * scrolled or cropped, and acting on a partial view would delete the wrong rows.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const AS_JSON = process.argv.includes("--json");

/* Executed on the server. Reads .env by hand because a bare node process does
   not get Next.js's env loading. */
const REMOTE = `
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
  .findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] })
  .then((rows) => {
    console.log("@@JSON@@" + JSON.stringify(rows));
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("QUERY_FAILED " + (e.message || e));
    await prisma.$disconnect();
    process.exit(1);
  });
`;

(async () => {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  try {
    const b64 = Buffer.from(REMOTE, "utf8").toString("base64");
    const cmd = `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_campaigns_list.cjs && node /tmp/_campaigns_list.cjs; rm -f /tmp/_campaigns_list.cjs`;
    const res = await ssh.execCommand(cmd);

    const marker = res.stdout.indexOf("@@JSON@@");
    if (marker === -1) {
      console.error(res.stdout.trim() || res.stderr.trim() || "no output");
      process.exitCode = 1;
      return;
    }

    const rows = JSON.parse(res.stdout.slice(marker + 8).trim());

    if (AS_JSON) {
      console.log(JSON.stringify(rows, null, 2));
      return;
    }

    console.log(`\nlive Campaign table  —  ${rows.length} row${rows.length === 1 ? "" : "s"}\n`);
    console.log(
      "  ord  active  " +
        "title".padEnd(24) +
        "location".padEnd(20) +
        "description".padEnd(44) +
        "id"
    );
    console.log("  " + "-".repeat(126));
    for (const r of rows) {
      console.log(
        "  " +
          String(r.order).padStart(3) +
          "  " +
          (r.isActive ? "yes   " : "NO    ") +
          "  " +
          String(r.title).slice(0, 22).padEnd(24) +
          String(r.location ?? "").slice(0, 18).padEnd(20) +
          String(r.description ?? "").replace(/\s+/g, " ").slice(0, 42).padEnd(44) +
          r.id
      );
    }
    console.log("");
  } finally {
    ssh.dispose();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
