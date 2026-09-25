/**
 * Prints the office and blog rows on both databases. Read-only.
 *
 *   node scripts/_offices_peek.js
 */
const fs = require("fs");
const { spawnSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const BODY = `
  (async () => {
    const out = {};
    out.offices = await prisma.office.findMany({ orderBy: { order: "asc" } }).catch(() => null);
    out.blogs = await prisma.blog.findMany({ select: { title: true, slug: true, createdAt: true } }).catch(() => null);
    process.stdout.write("@@JSON@@" + JSON.stringify(out));
    await prisma.$disconnect();
  })();
`;

function localSide() {
  const url = fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"))
    .replace(/^DATABASE_URL\s*=\s*/, "")
    .replace(/^["']|["']$/g, "");
  const res = spawnSync(
    process.execPath,
    ["-e", `const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); ${BODY}`],
    { env: { ...process.env, DATABASE_URL: url, PRISMA_READONLY: "1" }, encoding: "utf8" }
  );
  const i = (res.stdout || "").indexOf("@@JSON@@");
  if (i === -1) throw new Error("local failed: " + (res.stderr || "").slice(0, 200));
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

async function liveSide(ssh) {
  const script = `
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
    ${BODY}
  `;
  const b64 = Buffer.from(script, "utf8").toString("base64");
  const res = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_o.cjs && node /tmp/_o.cjs; rm -f /tmp/_o.cjs`
  );
  const i = res.stdout.indexOf("@@JSON@@");
  if (i === -1) throw new Error("live failed: " + (res.stdout || res.stderr).slice(0, 200));
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

const show = (label, data) => {
  console.log(`\n${label}`);
  console.log("  offices:");
  for (const o of data.offices ?? []) {
    console.log(
      `     ${String(o.order ?? "?").padStart(2)}  ${String(o.city ?? "").padEnd(14)}${String(o.name ?? "").padEnd(30)}${o.isActive === false ? "(inactive)" : ""}`
    );
  }
  console.log("  blogs:");
  for (const b of data.blogs ?? []) console.log(`     ${b.slug}`);
  if (!(data.blogs ?? []).length) console.log("     (none)");
};

(async () => {
  const l = localSide();
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  try {
    const v = await liveSide(ssh);
    show("LOCAL (what the site publishes today)", l);
    show("LIVE (what admin manages)", v);
    console.log("");
  } finally {
    ssh.dispose();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
