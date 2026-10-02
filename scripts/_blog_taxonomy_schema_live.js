/**
 * Additive-only blog taxonomy / SEO schema sync for the live database.
 * Never copies local rows. Never drops or alters existing blog content.
 *
 *   node scripts/_blog_taxonomy_schema_live.js diff
 *   node scripts/_blog_taxonomy_schema_live.js apply
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const mode = process.argv[2];
if (!["diff", "apply"].includes(mode)) {
  console.error("Usage: node scripts/_blog_taxonomy_schema_live.js diff|apply");
  process.exit(1);
}

const ssh = new NodeSSH();
const REMOTE_SCHEMA = "/tmp/balitech-blog-taxonomy-schema.prisma";

const ALLOWED = [
  /^ALTER TABLE `Blog` ADD /i,
  /^ALTER TABLE `BlogCategory` ADD /i,
  /^ALTER TABLE `BlogCategoryRedirect` ADD /i,
  /^ALTER TABLE `BlogCategoryTag` ADD /i,
  /^ALTER TABLE `BlogTagOnBlog` ADD /i,
  /^CREATE TABLE `BlogCategory`/i,
  /^CREATE TABLE `BlogCategoryRedirect`/i,
  /^CREATE TABLE `BlogTag`/i,
  /^CREATE TABLE `BlogCategoryTag`/i,
  /^CREATE TABLE `BlogTagOnBlog`/i,
  /^CREATE (UNIQUE )?INDEX /i,
];

async function run(cmd) {
  const res = await ssh.execCommand(cmd, { cwd: SERVER.remoteDir });
  return { code: res.code, out: res.stdout.trim(), err: res.stderr.trim() };
}

function isAdditive(sql) {
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  const bad = statements.filter((s) => !ALLOWED.some((re) => re.test(s)));
  return { statements, bad };
}

async function main() {
  console.log("Connecting to live server (schema check only — no local data)…");
  await ssh.connect(SERVER);
  await ssh.putFile(
    path.join(__dirname, "..", "prisma", "schema.prisma"),
    REMOTE_SCHEMA
  );

  const diff = await run(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel ${REMOTE_SCHEMA} --script`
  );
  if (diff.code !== 0) throw new Error("migrate diff failed:\n" + diff.err);
  console.log("SQL the live database needs:\n" + (diff.out || "(empty)") + "\n");

  const { statements, bad } = isAdditive(diff.out || "");
  if (statements.length === 0) {
    console.log("Live database already matches the schema. Nothing to change.");
    return;
  }
  if (bad.length) {
    throw new Error(
      "Refusing: diff contains non-additive / unsafe statements:\n" +
        bad.join(";\n")
    );
  }
  if (mode === "diff") {
    console.log("Diff looks additive. Re-run with `apply` to back up + apply.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/root/balitech-db-backup-${stamp}.sql.gz`;
  console.log("Backing up live DB before schema change…");
  const dump = await run(
    [
      "set -e",
      `URL=$(grep -E '^DATABASE_URL' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")`,
      `node -e 'const u=new URL(process.argv[1]);console.log([u.hostname,u.port||3306,decodeURIComponent(u.username),decodeURIComponent(u.password),u.pathname.slice(1)].join("\\n"))' "$URL" > /tmp/.bt_db`,
      "H=$(sed -n 1p /tmp/.bt_db); P=$(sed -n 2p /tmp/.bt_db); U=$(sed -n 3p /tmp/.bt_db); export MYSQL_PWD=$(sed -n 4p /tmp/.bt_db); D=$(sed -n 5p /tmp/.bt_db); rm -f /tmp/.bt_db",
      `mysqldump --single-transaction --no-tablespaces -h "$H" -P "$P" -u "$U" "$D" | gzip > ${backup}`,
      `ls -la ${backup}`,
    ].join("\n")
  );
  if (dump.code !== 0) throw new Error("Backup failed, nothing changed:\n" + dump.err);
  console.log("Backup written:\n" + dump.out);

  // db push with the new schema is additive here (guarded above). It does not
  // import local rows — only creates missing tables/columns on live.
  console.log("Applying additive schema on live…");
  const push = await run(
    `npx prisma db push --schema ${REMOTE_SCHEMA} --skip-generate --accept-data-loss`
  );
  console.log(push.out);
  if (push.code !== 0) throw new Error("db push failed:\n" + push.err);

  const after = await run(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel ${REMOTE_SCHEMA} --exit-code`
  );
  console.log(
    after.code === 0
      ? "Live database schema now matches. Blog rows were not overwritten."
      : "WARNING: still differs:\n" + after.out
  );
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await run(`rm -f ${REMOTE_SCHEMA}`);
    } catch {
      /* ignore */
    }
    ssh.dispose();
  });
