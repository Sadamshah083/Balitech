const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/lib/careers/career-board.ts",
  "src/lib/refresh-public-pages.ts",
  "src/components/career/CareerOpenings.tsx",
  "src/components/career/CareerJobDetail.tsx",
  "src/app/career/[id]/page.tsx",
  "src/app/globals.css",
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
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  await run(ssh, "mkdir", "mkdir -p 'src/app/career/[id]' src/components/career");

  for (const rel of FILES) {
    console.log(">> put", rel);
    await ssh.putFile(path.join(ROOT, rel.replace(/\//g, path.sep)), `${SERVER.remoteDir}/${rel}`);
  }

  await run(ssh, "build", "export NODE_OPTIONS=--max-old-space-size=3072; npm run build", {
    pty: true,
  });
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);

  const idRes = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.vacancy.findFirst({where:{isActive:true},select:{id:true,title:true}}).then(r=>{console.log(JSON.stringify(r));return p.\\$disconnect();})"`
  );
  console.log("\n>> sample vacancy", idRes.stdout || idRes.stderr);
  let id = "";
  try {
    id = JSON.parse((idRes.stdout || "").trim()).id;
  } catch {}

  await run(
    ssh,
    "verify",
    `sleep 3; curl -s -o /dev/null -w 'list:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/career; curl -s http://127.0.0.1:${APP_PORT}/career | tr '"' '\\n' | grep -E 'career-board|View job details|career-board__filters' | head -10; ${
      id
        ? `curl -s -o /dev/null -w 'detail:%{http_code}\\n' http://127.0.0.1:${APP_PORT}/career/${id}; curl -s http://127.0.0.1:${APP_PORT}/career/${id} | tr '"' '\\n' | grep -E 'Job description|Apply for this role|FE Closer|Branch' | head -15`
        : "echo no-id"
    }`
  );

  ssh.dispose();
  console.log(`\nOK http://${SERVER.host}:${PROJECT_PORT}/career`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
