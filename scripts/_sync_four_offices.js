/**
 * Ensures the four public offices exist with the correct names + addresses.
 *
 * Matches existing rows by address (or known legacy names) and updates them
 * in place. Inserts any that are missing. Never deletes Office rows, and never
 * touches Campaign / Lead / Media / Admin.
 *
 *   node scripts/_sync_four_offices.js --target live
 *   node scripts/_sync_four_offices.js --target live --apply
 */
const fs = require("fs");
const { spawnSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const APPLY = process.argv.includes("--apply");
const TARGET = (() => {
  const i = process.argv.indexOf("--target");
  return i === -1 ? "live" : process.argv[i + 1];
})();

function mapUrl(address) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed`;
}

const CANONICAL = [
  {
    name: "Shamsabad Office",
    slug: "shamsabad-office",
    address:
      "Office 8, 1st Floor, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400",
    phone: "0370 0585660 / 0327 1233435",
    email: "info@balitech.org",
    hours: "Monday–Friday · 6:00 PM – 4:00 AM",
    city: "Rawalpindi",
    country: "Pakistan",
    mapEmbedUrl: mapUrl(
      "Office 8, Maryam Business Centre, Murree Road, Shamsabad, Rawalpindi, Punjab 4400"
    ),
    order: 1,
    isHeadOffice: true,
    isActive: true,
    match: (o) =>
      /maryam|shamsabad/i.test(`${o.name} ${o.address} ${o.slug}`) ||
      o.slug === "shamsabad-office" ||
      o.slug === "maryam-business-centre",
  },
  {
    name: "Islamabad Office",
    slug: "islamabad-office",
    address: "Plot No.349-352 street No 1 industrial Area 1-9/3, Islamabad",
    phone: "0370 0585660 / 0327 1233435",
    email: "info@balitech.org",
    hours: "Monday–Friday · 6:00 PM – 4:00 AM",
    city: "Islamabad",
    country: "Pakistan",
    mapEmbedUrl: mapUrl(
      "Plot No.349-352 street No 1 industrial Area 1-9/3, Islamabad"
    ),
    order: 2,
    isHeadOffice: false,
    isActive: true,
    match: (o) =>
      /islamabad|1-9\/3|i-9\/3|349-352/i.test(`${o.name} ${o.address} ${o.slug}`) ||
      o.slug === "islamabad-office",
  },
  {
    name: "Commercial Office",
    slug: "commercial-office",
    address:
      "Office No 1, 3rd Floor, Satellite Town B Block, Ideas Building Plaza Rwp",
    phone: "0370 0585660 / 0327 1233435",
    email: "info@balitech.org",
    hours: "Monday–Friday · 6:00 PM – 4:00 AM",
    city: "Rawalpindi",
    country: "Pakistan",
    mapEmbedUrl: mapUrl(
      "Ideas Building Plaza Satellite Town B Block Rawalpindi"
    ),
    order: 3,
    isHeadOffice: false,
    isActive: true,
    match: (o) =>
      /ideas|commercial|satellite town b/i.test(
        `${o.name} ${o.address} ${o.slug}`
      ) ||
      o.slug === "commercial-office" ||
      o.slug === "ideas-building-plaza",
  },
  {
    name: "Iran Road Office",
    slug: "iran-road-office",
    address: "Plaza No A-74, Iran Road Satellite Town-A Rawalpindi Punjab Pakistan",
    phone: "0370 0585660 / 0327 1233435",
    email: "info@balitech.org",
    hours: "Monday–Friday · 6:00 PM – 4:00 AM",
    city: "Rawalpindi",
    country: "Pakistan",
    mapEmbedUrl: mapUrl("Plaza No A-74, Iran Road Satellite Town-A Rawalpindi"),
    order: 4,
    isHeadOffice: false,
    isActive: true,
    match: (o) =>
      /iran road|a-74/i.test(`${o.name} ${o.address} ${o.slug}`) ||
      o.slug === "iran-road-office",
  },
];

const BODY = `
  const CANONICAL = ${JSON.stringify(
    CANONICAL.map(({ match, ...rest }) => rest)
  )};
  const MATCHERS = ${JSON.stringify(
    CANONICAL.map((c) => ({
      slug: c.slug,
      // serialized as source strings; rebuilt below
      source: c.match.toString(),
    }))
  )};
  const APPLY = ${JSON.stringify(APPLY)};

  function matcherFor(slug) {
    const entry = MATCHERS.find((m) => m.slug === slug);
    // Reconstruct from the source we embedded: "o => /.../.test(...)"
    // Safer: hard-code the same rules here.
    const rules = {
      "shamsabad-office": (o) => /maryam|shamsabad/i.test(o.name + " " + o.address + " " + o.slug) || o.slug === "shamsabad-office" || o.slug === "maryam-business-centre",
      "islamabad-office": (o) => /islamabad|1-9\\/3|i-9\\/3|349-352/i.test(o.name + " " + o.address + " " + o.slug) || o.slug === "islamabad-office",
      "commercial-office": (o) => /ideas|commercial|satellite town b/i.test(o.name + " " + o.address + " " + o.slug) || o.slug === "commercial-office" || o.slug === "ideas-building-plaza",
      "iran-road-office": (o) => /iran road|a-74/i.test(o.name + " " + o.address + " " + o.slug) || o.slug === "iran-road-office",
    };
    return rules[slug];
  }

  (async () => {
    const before = await prisma.office.findMany({ orderBy: { order: "asc" } });
    const used = new Set();
    const plan = [];

    for (const want of CANONICAL) {
      const matchFn = matcherFor(want.slug);
      const existing =
        before.find((o) => !used.has(o.id) && matchFn(o)) ||
        before.find((o) => !used.has(o.id) && o.slug === want.slug) ||
        null;

      if (existing) {
        used.add(existing.id);
        const data = {
          name: want.name,
          slug: want.slug,
          address: want.address,
          phone: want.phone,
          email: want.email,
          hours: want.hours,
          city: want.city,
          country: want.country,
          mapEmbedUrl: want.mapEmbedUrl,
          order: want.order,
          isHeadOffice: want.isHeadOffice,
          isActive: true,
        };
        plan.push({ action: "update", id: existing.id, from: existing, to: data });
        if (APPLY) {
          await prisma.office.update({ where: { id: existing.id }, data });
        }
      } else {
        plan.push({ action: "create", to: want });
        if (APPLY) {
          await prisma.office.create({
            data: {
              name: want.name,
              slug: want.slug,
              address: want.address,
              phone: want.phone,
              email: want.email,
              hours: want.hours,
              city: want.city,
              country: want.country,
              mapEmbedUrl: want.mapEmbedUrl,
              order: want.order,
              isHeadOffice: want.isHeadOffice,
              isActive: true,
            },
          });
        }
      }
    }

    const after = await prisma.office.findMany({ orderBy: { order: "asc" } });
    const counts = {
      office: await prisma.office.count(),
      campaign: await prisma.campaign.count(),
      lead: await prisma.lead.count(),
      mediaItem: await prisma.mediaItem.count(),
      admin: await prisma.admin.count(),
    };

    process.stdout.write(
      "@@JSON@@" +
        JSON.stringify({
          before: before.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            address: o.address,
            order: o.order,
            isActive: o.isActive,
          })),
          plan: plan.map((p) => ({
            action: p.action,
            id: p.id || null,
            name: p.to.name,
            address: p.to.address,
            fromName: p.from ? p.from.name : null,
          })),
          after: after.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            address: o.address,
            order: o.order,
            isActive: o.isActive,
          })),
          counts,
          applied: APPLY,
        })
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
  if (i === -1) throw new Error("local failed: " + ((res.stderr || res.stdout || "").slice(0, 500)));
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
    `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_sync_offices.cjs && node /tmp/_sync_offices.cjs; rm -f /tmp/_sync_offices.cjs`
  );
  const i = res.stdout.indexOf("@@JSON@@");
  if (i === -1) throw new Error("live failed: " + ((res.stdout || res.stderr || "").slice(0, 500)));
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

function report(label, data) {
  console.log(`\n${label} — ${data.applied ? "APPLIED" : "dry run"}`);
  console.log("  counts:", data.counts);
  console.log("  before:");
  for (const o of data.before) {
    console.log(`    ${o.order}. ${o.name}  |  ${o.address}`);
  }
  console.log("  plan:");
  for (const p of data.plan) {
    if (p.action === "update") {
      console.log(`    UPDATE ${p.fromName} -> ${p.name}`);
      console.log(`           ${p.address}`);
    } else {
      console.log(`    CREATE ${p.name}`);
      console.log(`           ${p.address}`);
    }
  }
  console.log("  after:");
  for (const o of data.after) {
    console.log(`    ${o.order}. ${o.name}  |  ${o.address}`);
  }
}

(async () => {
  console.log(APPLY ? "APPLY mode" : "Dry run (pass --apply to write)");
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
