/**
 * Lists which office / blog / media rows exist locally but not live, and vice
 * versa, so the difference can be judged as real content or leftover test data.
 *
 *   node scripts/_db_diff_rows.js
 *
 * Read-only on both sides. The live half runs on the server for the same reason
 * as _db_compare.js.
 */
const fs = require("fs");
const { spawnSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const BODY = `
  (async () => {
    const out = {};
    try {
      out.offices = await prisma.office.findMany({ select: { id: true, city: true, name: true } });
    } catch { out.offices = null; }
    try {
      out.blogs = await prisma.blog.findMany({ select: { id: true, title: true, slug: true } });
    } catch { out.blogs = null; }
    try {
      out.media = await prisma.mediaItem.findMany({ select: { id: true, title: true, type: true } });
    } catch { out.media = null; }
    process.stdout.write("@@JSON@@" + JSON.stringify(out));
    await prisma.$disconnect();
  })();
`;

function local() {
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
  if (i === -1) throw new Error("local query failed: " + (res.stderr || "").slice(0, 300));
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

async function live(ssh) {
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
    `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_d.cjs && node /tmp/_d.cjs; rm -f /tmp/_d.cjs`
  );
  const i = res.stdout.indexOf("@@JSON@@");
  if (i === -1) throw new Error("live query failed: " + (res.stdout || res.stderr).slice(0, 300));
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

const key = (r) => (r.slug || r.city || r.title || r.id);

function report(label, l, v) {
  console.log(`\n${label}`);
  if (!l || !v) {
    console.log("   (model unavailable on one side)");
    return;
  }
  const liveKeys = new Set(v.map(key));
  const localKeys = new Set(l.map(key));

  const onlyLocal = l.filter((r) => !liveKeys.has(key(r)));
  const onlyLive = v.filter((r) => !localKeys.has(key(r)));

  console.log(`   local ${l.length}, live ${v.length}`);
  if (onlyLocal.length) {
    console.log(`   only in LOCAL (would disappear from the site):`);
    for (const r of onlyLocal.slice(0, 15)) console.log(`      - ${key(r)}${r.name ? ` (${r.name})` : ""}`);
  }
  if (onlyLive.length) {
    console.log(`   only in LIVE (would appear on the site):`);
    for (const r of onlyLive.slice(0, 15)) console.log(`      + ${key(r)}${r.name ? ` (${r.name})` : ""}`);
  }
  if (!onlyLocal.length && !onlyLive.length) console.log("   identical sets");
}

(async () => {
  const l = local();
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  let v;
  try {
    v = await live(ssh);
  } finally {
    ssh.dispose();
  }

  report("OFFICES", l.offices, v.offices);
  report("BLOGS", l.blogs, v.blogs);
  report("MEDIA", l.media, v.media);
  console.log("");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
