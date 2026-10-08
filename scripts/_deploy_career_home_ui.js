/**
 * Deploy career/home UI code only.
 * Does NOT touch MySQL, does NOT push local DB, does NOT run seeds or prisma db push.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");

/** Source files only — never prisma seed, never .env, never DB scripts. */
const FILES = [
  "src/app/page.tsx",
  "src/app/globals.css",
  "src/components/home/HomeOpenVacancies.tsx",
  "src/components/home/HomeRecentBlogs.tsx",
  "src/components/home/HomeCareers.tsx",
  "src/components/career/CareerOpenings.tsx",
  "src/components/career/CareerJobDetail.tsx",
  "src/components/admin/VacanciesManager.tsx",
  "src/lib/careers/career-board.ts",
  "src/lib/careers/catalog.ts",
  "src/lib/careers/vacancies.ts",
];

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, {
    cwd: opts.cwd || SERVER.remoteDir,
    execOptions: { pty: !!opts.pty },
  });
  if (res.stdout) console.log(res.stdout.trim().slice(-4000));
  if (res.stderr) {
    const err = res.stderr.trim();
    if (err) console.error(err.slice(-1500));
  }
  if (!opts.allowFail && res.code !== 0 && res.code !== null) {
    throw new Error(`${label} failed (${res.code})`);
  }
  return res;
}

async function main() {
  console.log("Deploying CODE ONLY to", SERVER.host + ":" + SERVER.port);
  console.log("No database sync. No seed. No prisma db push. No local DB copy.");

  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  await run(
    ssh,
    "ensure dirs",
    "mkdir -p src/app src/components/home src/components/career src/components/admin src/lib/careers"
  );

  for (const rel of FILES) {
    const local = path.join(ROOT, rel.replace(/\//g, path.sep));
    const remote = `${SERVER.remoteDir}/${rel}`;
    console.log(">> put", rel);
    await ssh.putFile(local, remote);
  }

  // Build + restart app only — never migrate / seed / mysql
  await run(ssh, "build (app code only)", "export NODE_OPTIONS=--max-old-space-size=3072; npm run build", {
    pty: true,
  });
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);

  await run(
    ssh,
    "verify pages (HTTP only)",
    `sleep 3; curl -s -o /dev/null -w 'home:%{http_code} career:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/ http://127.0.0.1:${APP_PORT}/career`
  );

  ssh.dispose();
  console.log(`\nOK code live — DB untouched`);
  console.log(`http://${SERVER.host}:${PROJECT_PORT}/`);
  console.log(`http://${SERVER.host}:${PROJECT_PORT}/career`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
