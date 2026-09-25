/**
 * Gives the Campaign table its `locations` column and sets the branches of the
 * campaigns that run at more than one office.
 *
 *   node scripts/_campaign_branches.js                    # local, dry run
 *   node scripts/_campaign_branches.js --apply            # local
 *   node scripts/_campaign_branches.js --target live      # live, dry run
 *   node scripts/_campaign_branches.js --target live --apply
 *
 * Everything here is additive: one ADD COLUMN and UPDATEs to a column that did
 * not exist until it ran. No row is deleted and no other column is written, and
 * the row count of every table is compared before and after — a difference in
 * any of them fails the run rather than being reported afterwards.
 *
 * All of it is raw SQL on purpose. The live server's Prisma client is generated
 * from the deployed schema, which does not know about `locations` until the next
 * deploy, so a typed query would not compile there. Raw SQL also means the
 * column can be in place before the code that needs it ships, which is the order
 * that keeps the site working throughout.
 *
 * Live runs execute on the server rather than through a tunnel, for the reason
 * given in _db_compare.js: spawnSync blocks the loop a tunnel needs.
 */
const fs = require("fs");
const { spawnSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const targetIndex = args.indexOf("--target");
const target = targetIndex === -1 ? "local" : (args[targetIndex + 1] || "").toLowerCase();

if (!["local", "live"].includes(target)) {
  console.error(`--target must be "local" or "live", got "${target}"`);
  process.exit(1);
}

/* Mirrors seedCampaignLocations in src/lib/campaign-locations.ts. Duplicated
   rather than imported because this body also runs on the server, where only
   the deployed JavaScript exists. */
const BRANCH_PLAN = {
  "Final Expense": ["Iran Road Office", "Commercial Office"],
};

const MODELS = ["campaign", "office", "blog", "mediaItem", "lead", "admin"];

const BODY = `
  const APPLY = ${JSON.stringify(apply)};
  const PLAN = ${JSON.stringify(BRANCH_PLAN)};
  const MODELS = ${JSON.stringify(MODELS)};

  const countAll = async () => {
    const out = {};
    for (const m of MODELS) {
      try { out[m] = await prisma[m].count(); } catch { out[m] = null; }
    }
    return out;
  };

  const readRows = () =>
    prisma.$queryRawUnsafe(
      "SELECT title, location, locations, isActive, \`order\` AS ord FROM Campaign ORDER BY \`order\` ASC"
    );

  (async () => {
    const result = { apply: APPLY, steps: [] };
    result.before = await countAll();

    const columnRows = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) AS n FROM information_schema.COLUMNS " +
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Campaign' AND COLUMN_NAME = 'locations'"
    );
    let hasColumn = Number(columnRows[0].n) > 0;

    if (!hasColumn) {
      if (APPLY) {
        await prisma.$executeRawUnsafe(
          "ALTER TABLE Campaign ADD COLUMN locations VARCHAR(191) NOT NULL DEFAULT '[]'"
        );
        hasColumn = true;
        result.steps.push("added column Campaign.locations");
      } else {
        result.steps.push("would add column Campaign.locations");
      }
    } else {
      result.steps.push("column Campaign.locations already present");
    }

    if (hasColumn) {
      /* Every row that has never had a branch list gets one holding the single
         office it already named, so nothing reads as branch-less. */
      const pending = await prisma.$queryRawUnsafe(
        "SELECT COUNT(*) AS n FROM Campaign WHERE locations IS NULL OR locations = '' OR locations = '[]'"
      );
      const backfill = Number(pending[0].n);

      if (backfill > 0) {
        if (APPLY) {
          const changed = await prisma.$executeRawUnsafe(
            "UPDATE Campaign SET locations = CONCAT('[', JSON_QUOTE(location), ']') " +
              "WHERE locations IS NULL OR locations = '' OR locations = '[]'"
          );
          result.steps.push("backfilled " + changed + " row(s) from their existing location");
        } else {
          result.steps.push("would backfill " + backfill + " row(s) from their existing location");
        }
      } else {
        result.steps.push("nothing to backfill");
      }

      for (const [title, branches] of Object.entries(PLAN)) {
        const wanted = JSON.stringify(branches);
        const rows = await prisma.$queryRawUnsafe(
          "SELECT locations FROM Campaign WHERE title = ?",
          title
        );

        if (rows.length === 0) {
          result.steps.push('no campaign titled "' + title + '" — left alone');
          continue;
        }
        if (rows.every((r) => r.locations === wanted)) {
          result.steps.push('"' + title + '" already at ' + wanted);
          continue;
        }

        if (APPLY) {
          const changed = await prisma.$executeRawUnsafe(
            "UPDATE Campaign SET locations = ?, location = ? WHERE title = ?",
            wanted,
            branches[0],
            title
          );
          result.steps.push('set "' + title + '" to ' + wanted + " (" + changed + " row)");
        } else {
          result.steps.push('would set "' + title + '" to ' + wanted);
        }
      }
    }

    result.rows = hasColumn ? await readRows() : [];
    result.after = await countAll();

    process.stdout.write(
      "@@JSON@@" +
        JSON.stringify(result, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
    );
    await prisma.$disconnect();
  })().catch(async (error) => {
    process.stdout.write("@@JSON@@" + JSON.stringify({ error: String(error.message || error) }));
    try { await prisma.$disconnect(); } catch {}
  });
`;

function runLocal() {
  const url = fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL"))
    .replace(/^DATABASE_URL\s*=\s*/, "")
    .replace(/^["']|["']$/g, "");

  const script = `
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    ${BODY}
  `;

  const res = spawnSync(process.execPath, ["-e", script], {
    env: { ...process.env, DATABASE_URL: url, PRISMA_READONLY: "" },
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
  });

  const i = (res.stdout || "").indexOf("@@JSON@@");
  if (i === -1) throw new Error(res.stderr || res.stdout || "no output");
  return JSON.parse(res.stdout.slice(i + 8).trim());
}

async function runLive() {
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

  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  try {
    const b64 = Buffer.from(script, "utf8").toString("base64");
    const res = await ssh.execCommand(
      `cd ${SERVER.remoteDir} && echo ${b64} | base64 -d > /tmp/_cb.cjs && node /tmp/_cb.cjs; rm -f /tmp/_cb.cjs`
    );
    const i = res.stdout.indexOf("@@JSON@@");
    if (i === -1) throw new Error(res.stderr || res.stdout || "no output");
    return JSON.parse(res.stdout.slice(i + 8).trim());
  } finally {
    ssh.dispose();
  }
}

(async () => {
  console.log(
    `\n${target.toUpperCase()} database — ${apply ? "APPLYING" : "dry run (pass --apply to write)"}\n`
  );

  const result = target === "live" ? await runLive() : runLocal();
  if (result.error) throw new Error(result.error);

  for (const step of result.steps) console.log("  - " + step);

  console.log("\n  row counts");
  let lost = [];
  for (const model of MODELS) {
    const before = result.before[model];
    const after = result.after[model];
    const same = before === after;
    if (!same) lost.push(model);
    console.log(
      "    " +
        model.padEnd(12) +
        String(before ?? "-").padStart(6) +
        " -> " +
        String(after ?? "-").padStart(6) +
        (same ? "   unchanged" : "   CHANGED")
    );
  }

  console.log("\n  campaigns");
  for (const row of result.rows) {
    const branches = JSON.parse(row.locations || "[]");
    console.log(
      "    " +
        String(row.ord).padStart(3) +
        "  " +
        String(row.title).padEnd(30) +
        (branches.length > 1 ? branches.length + " branches: " : "") +
        (branches.join(", ") || "(none)")
    );
  }

  if (lost.length) {
    throw new Error(
      `Row count changed in: ${lost.join(", ")}. This script only adds a column ` +
        `and writes to it, so that should be impossible — investigate before deploying.`
    );
  }

  console.log(
    apply ? "\nDone. Nothing was removed.\n" : "\nNothing was written. Re-run with --apply.\n"
  );
})().catch((error) => {
  console.error("\n" + (error.message || error) + "\n");
  process.exit(1);
});
