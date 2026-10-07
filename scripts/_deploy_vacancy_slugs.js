/**
 * Add Vacancy.slug on live DB, backfill SEO slugs, deploy career/[slug] routes.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "prisma/schema.prisma",
  "src/lib/careers/application.ts",
  "src/lib/careers/vacancies.ts",
  "src/lib/careers/career-board.ts",
  "src/app/api/vacancies/route.ts",
  "src/app/api/vacancies/[id]/route.ts",
  "src/app/career/[slug]/page.tsx",
  "src/components/career/CareerOpenings.tsx",
  "src/components/career/CareerJobDetail.tsx",
  "src/components/join-us/JoinUsApplicationForm.tsx",
  "src/components/admin/VacanciesManager.tsx",
];

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

  await run(
    ssh,
    "add slug column if missing",
    `mysql -ubalitech_user -p'BaliTechDB_2026!' balitech_db -e "
      SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA='balitech_db' AND TABLE_NAME='Vacancy' AND COLUMN_NAME='slug');
      SET @sql := IF(@c=0,
        'ALTER TABLE Vacancy ADD COLUMN slug VARCHAR(191) NULL',
        'SELECT ''slug_exists''');
      PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    "`,
    { allowFail: true }
  );

  await run(
    ssh,
    "backfill SEO slugs",
    `node <<'NODE'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
function slugify(title) {
  const base = String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || "role";
}
(async () => {
  // prisma client may not know slug yet — use raw
  const rows = await p.$queryRawUnsafe("SELECT id, title, slug FROM Vacancy");
  const used = new Set(rows.map((r) => r.slug).filter(Boolean));
  for (const row of rows) {
    if (row.slug && String(row.slug).trim()) continue;
    let base = slugify(row.title);
    let candidate = base;
    let i = 1;
    while (used.has(candidate)) {
      i += 1;
      candidate = base + "-" + i;
    }
    used.add(candidate);
    await p.$executeRawUnsafe("UPDATE Vacancy SET slug = ? WHERE id = ?", candidate, row.id);
    console.log("SLUG", row.id, "->", candidate);
  }
  await p.$executeRawUnsafe("UPDATE Vacancy SET slug = CONCAT('role-', id) WHERE slug IS NULL OR slug = ''");
  try {
    await p.$executeRawUnsafe("ALTER TABLE Vacancy MODIFY slug VARCHAR(191) NOT NULL");
  } catch (e) {
    console.log("MODIFY", e.message);
  }
  try {
    await p.$executeRawUnsafe("CREATE UNIQUE INDEX Vacancy_slug_key ON Vacancy(slug)");
  } catch (e) {
    console.log("INDEX", e.message);
  }
  const sample = await p.$queryRawUnsafe("SELECT id, title, slug FROM Vacancy LIMIT 10");
  console.log(JSON.stringify(sample, null, 2));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE`
  );

  await run(ssh, "mkdir slug route", "mkdir -p 'src/app/career/[slug]'");
  await run(ssh, "remove old id route", "rm -rf 'src/app/career/[id]'", { allowFail: true });

  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(path.join(ROOT, rel.replace(/\//g, path.sep)), `${SERVER.remoteDir}/${rel}`);
  }

  await run(
    ssh,
    "prisma generate + build",
    "export NODE_OPTIONS=--max-old-space-size=3072; npx prisma generate && npm run build",
    { pty: true }
  );
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);

  await run(
    ssh,
    "verify SEO urls",
    `sleep 3; curl -s http://127.0.0.1:${APP_PORT}/career | tr '"' '\\n' | grep -E '/career/[a-z0-9-]+' | grep -v cmuy | sort | uniq | head -15; curl -s -o /dev/null -w 'slug-page:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/career/fe-closer-final-expense; curl -s -o /dev/null -w 'old-id-redirect:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/career/cmuyinjkt0000of7jl6vq2pgy; curl -sI http://127.0.0.1:${APP_PORT}/career/cmuyinjkt0000of7jl6vq2pgy | head -8`
  );

  ssh.dispose();
  console.log(`\nOK — SEO slugs live. Example: http://${SERVER.host}:${PROJECT_PORT}/career/fe-closer-final-expense`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
