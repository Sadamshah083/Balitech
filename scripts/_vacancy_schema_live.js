/**
 * Applies the careers-application schema (Vacancy table + Lead columns) to the
 * live database.
 *
 *   node scripts/_vacancy_schema_live.js diff    # show the SQL, change nothing
 *   node scripts/_vacancy_schema_live.js apply   # back up the DB, then db push
 *
 * `apply` refuses to run if the diff contains anything other than CREATE TABLE
 * Vacancy, ADD COLUMN and CREATE UNIQUE INDEX on Lead.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const mode = process.argv[2];
if (!["diff", "apply"].includes(mode)) {
  console.error("Usage: node scripts/_vacancy_schema_live.js diff|apply");
  process.exit(1);
}

const ssh = new NodeSSH();
const REMOTE_SCHEMA = "/tmp/balitech-careers-schema.prisma";

async function run(cmd) {
  const res = await ssh.execCommand(cmd, { cwd: SERVER.remoteDir });
  return { code: res.code, out: res.stdout.trim(), err: res.stderr.trim() };
}

function isAdditive(sql) {
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  const bad = statements.filter(
    (s) =>
      !/^CREATE TABLE `Vacancy`/i.test(s) &&
      !/^ALTER TABLE `Lead` ADD COLUMN/i.test(s) &&
      !/^CREATE UNIQUE INDEX `Lead_(referenceId|submissionKey)_key` ON `Lead`/i.test(s)
  );
  return { statements, bad };
}

async function main() {
  await ssh.connect(SERVER);
  await ssh.putFile(path.join(__dirname, "..", "prisma", "schema.prisma"), REMOTE_SCHEMA);

  const diff = await run(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel ${REMOTE_SCHEMA} --script`
  );
  if (diff.code !== 0) throw new Error("migrate diff failed:\n" + diff.err);
  console.log("SQL the live database needs:\n" + diff.out + "\n");

  const { statements, bad } = isAdditive(diff.out);
  if (statements.length === 0) {
    console.log("Live database already matches the schema.");
    return;
  }
  if (bad.length) {
    throw new Error("Refusing: diff contains non-additive statements:\n" + bad.join(";\n"));
  }
  if (mode === "diff") return;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `/root/balitech-db-backup-${stamp}.sql.gz`;
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

  const push = await run(
    `npx prisma db push --schema ${REMOTE_SCHEMA} --skip-generate --accept-data-loss`
  );
  console.log(push.out);
  if (push.code !== 0) throw new Error("db push failed:\n" + push.err);

  const after = await run(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel ${REMOTE_SCHEMA} --exit-code`
  );
  console.log(after.code === 0 ? "Live database now matches the schema." : "WARNING: still differs:\n" + after.out);
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await run(`rm -f ${REMOTE_SCHEMA}`);
    } catch {}
    ssh.dispose();
  });
