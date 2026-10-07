/**
 * Deploy /career job board + admin vacancy template UX. Does not touch join-us.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, PROJECT_PORT, APP_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/lib/navigation.ts",
  "src/lib/careers/career-board.ts",
  "src/lib/refresh-public-pages.ts",
  "src/components/career/CareerHero.tsx",
  "src/components/career/CareerOpenings.tsx",
  "src/app/career/page.tsx",
  "src/app/globals.css",
  "src/app/sitemap.ts",
  "src/app/llms.txt/route.ts",
  "src/components/landing/SiteHeader.tsx",
  "src/components/landing/Footer.tsx",
  "src/components/home/HomeCareers.tsx",
  "src/components/admin/VacanciesManager.tsx",
  "next.config.ts",
  "prisma/schema.prisma",
  "CLAUDE.md",
];

async function run(ssh, label, cmd, opts = {}) {
  console.log("\n>>", label);
  const res = await ssh.execCommand(cmd, {
    cwd: opts.cwd || SERVER.remoteDir,
    execOptions: { pty: !!opts.pty },
  });
  if (res.stdout) console.log(res.stdout.trim().slice(-4500));
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
  await run(ssh, "mkdir career dirs", "mkdir -p src/app/career src/components/career src/lib/careers");

  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(
      path.join(ROOT, rel.replace(/\//g, path.sep)),
      `${SERVER.remoteDir}/${rel}`
    );
  }

  await run(
    ssh,
    "build",
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { pty: true }
  );
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);
  await run(
    ssh,
    "verify",
    `sleep 3; curl -s -o /dev/null -w 'career:%{http_code} join:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/career http://127.0.0.1:${APP_PORT}/join-us; curl -s http://127.0.0.1:${PROJECT_PORT}/career | tr '"' '\\n' | grep -E 'career-openings|Jobs at BALITECH|Grow Your Future' | head -10`
  );
  ssh.dispose();
  console.log("\nDEPLOY_OK http://" + SERVER.host + ":" + PROJECT_PORT + "/career");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
