/**
 * Updates only the Islamabad office street number from 5 → 1.
 * Touches address + mapEmbedUrl when they still contain the old street.
 *
 *   node scripts/_fix_islamabad_street.js            # dry-run local + live
 *   node scripts/_fix_islamabad_street.js --apply    # write
 *   node scripts/_fix_islamabad_street.js --target local --apply
 *   node scripts/_fix_islamabad_street.js --target live --apply
 */
const fs = require("fs");
const { spawnSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const OLD = "Plot No.349-352 street No 5 industrial Area 1-9/3, Islamabad";
const NEW = "Plot No.349-352 street No 1 industrial Area 1-9/3, Islamabad";
const APPLY = process.argv.includes("--apply");
const TARGET = (() => {
  const i = process.argv.indexOf("--target");
  return i === -1 ? "both" : process.argv[i + 1];
})();

function mapUrl(address) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

const BODY = `
  const OLD = ${JSON.stringify(OLD)};
  const NEW = ${JSON.stringify(NEW)};
  const APPLY = ${JSON.stringify(APPLY)};
  const mapUrl = (address) =>
    "https://maps.google.com/maps?q=" + encodeURIComponent(address) + "&hl=en&z=14&output=embed";

  (async () => {
    const before = await prisma.office.findMany({
      select: { id: true, name: true, slug: true, address: true, mapEmbedUrl: true },
      orderBy: { order: "asc" },
    });

    const targets = before.filter(
      (o) =>
        o.address === OLD ||
        (o.mapEmbedUrl && o.mapEmbedUrl.includes(encodeURIComponent(OLD))) ||
        (o.mapEmbedUrl && o.mapEmbedUrl.includes("street%20No%205")) ||
        (o.address && /street\\s+No\\.?\\s*5/i.test(o.address) && /349-352/i.test(o.address))
    );

    const updates = [];
    for (const o of targets) {
      const nextAddress =
        o.address === OLD || (/street\\s+No\\.?\\s*5/i.test(o.address || "") && /349-352/i.test(o.address || ""))
          ? NEW
          : o.address;
      const nextMap =
        !o.mapEmbedUrl ||
        o.mapEmbedUrl.includes(encodeURIComponent(OLD)) ||
        o.mapEmbedUrl.includes("street%20No%205") ||
        o.address !== nextAddress
          ? mapUrl(nextAddress)
          : o.mapEmbedUrl;

      updates.push({
        id: o.id,
        name: o.name,
        from: { address: o.address, mapEmbedUrl: o.mapEmbedUrl },
        to: { address: nextAddress, mapEmbedUrl: nextMap },
      });

      if (APPLY) {
        await prisma.office.update({
          where: { id: o.id },
          data: { address: nextAddress, mapEmbedUrl: nextMap },
        });
      }
    }

    const after = await prisma.office.findMany({
      select: { id: true, name: true, slug: true, address: true, mapEmbedUrl: true },
      orderBy: { order: "asc" },
    });

    const counts = {
      office: await prisma.office.count(),
      campaign: await prisma.campaign.count(),
      lead: await prisma.lead.count(),
      mediaItem: await prisma.mediaItem.count(),
      admin: await prisma.admin.count(),
    };

    process.stdout.write(
      "@@JSON@@" +
        JSON.stringify({ before, updates, after, counts, applied: APPLY })
    );
    await prisma.$disconnect();
  })();
`;

function runLocal() {
  const url = fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"))
    .replace(/^DATABASE_URL\s*=\s*/, "")
    .replace(/^["']|["']$/g, "");
  const res = spawnSync(
    process.execPath,
    [
      "-e",
      `const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); ${BODY}`,
    ],
    {
      env: { ...process.env, DATABASE_URL: url, PRISMA_READONLY: APPLY ? "0" : "1" },
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  const i = (res.stdout || "").indexOf("@@JSON@@");
  if (i === -1) {
    throw new Error("local failed: " + ((res.stderr || res.stdout || "").slice(0, 400)));
  }
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

async function runLive(ssh) {
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
    delete process.env.PRISMA_READONLY;
    const { PrismaClient } = require(path.join(root, "node_modules", "@prisma", "client"));
    const prisma = new PrismaClient();
    ${BODY}
  `;
  const b64 = Buffer.from(script, "utf8").toString("base64");
  const res = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_fix_street.cjs && node /tmp/_fix_street.cjs; rm -f /tmp/_fix_street.cjs`
  );
  const i = res.stdout.indexOf("@@JSON@@");
  if (i === -1) {
    throw new Error("live failed: " + ((res.stdout || res.stderr || "").slice(0, 400)));
  }
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

function report(label, data) {
  console.log(`\n${label} — ${data.applied ? "APPLIED" : "dry run"}`);
  console.log("  row counts:", data.counts);
  if (!data.updates.length) {
    console.log("  no matching Islamabad street-5 rows");
  }
  for (const u of data.updates) {
    console.log(`  ${u.name} (${u.id})`);
    console.log(`    address: ${u.from.address}`);
    console.log(`         -> ${u.to.address}`);
  }
  console.log("  current offices:");
  for (const o of data.after) {
    console.log(`    - ${o.name}: ${o.address}`);
  }
}

(async () => {
  console.log(APPLY ? "APPLY mode" : "Dry run (pass --apply to write)");
  console.log(`Old: ${OLD}`);
  console.log(`New: ${NEW}`);

  if (TARGET === "local" || TARGET === "both") {
    try {
      report("LOCAL", runLocal());
    } catch (err) {
      console.warn("LOCAL skipped:", err.message || err);
      if (TARGET === "local") throw err;
    }
  }

  if (TARGET === "live" || TARGET === "both") {
    const ssh = new NodeSSH();
    await ssh.connect(SERVER);
    try {
      report("LIVE", await runLive(ssh));
    } finally {
      ssh.dispose();
    }
  }

  if (!APPLY) console.log("\nNothing was written. Re-run with --apply.");
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
