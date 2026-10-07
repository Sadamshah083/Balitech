/**
 * Create Final Expense Closer vacancy at Islamabad (I-9/3) branch on live DB.
 * Rebuilds /career so it appears immediately.
 */
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER, PM2_APP, APP_PORT, PROJECT_PORT } = require("./deploy-config");

const ROOT = path.join(__dirname, "..");

const DESCRIPTION = `Final Expense Closer — Islamabad (I-9/3)

Role overview
We are hiring experienced Final Expense Closers for our Islamabad I-9/3 floor. You will take warm and qualified Final Expense opportunities through the closing conversation, handle objections with confidence, and complete enrollments to campaign standards under supervisor oversight.

Key responsibilities
• Close Final Expense sales conversations with eligible prospects
• Follow approved scripts, compliance rules, and disclosure requirements
• Document outcomes accurately in CRM / dialer tools
• Meet daily and weekly closing and quality targets
• Work with verifiers, team leads, and QA for a clean handoff and audit trail
• Attend coaching, calibration, and campaign update sessions

Requirements
• Proven closer experience on Final Expense or similar insurance campaigns preferred
• Strong spoken English and clear phone presence
• Comfortable with US-shift hours (typically Monday–Friday, evening/night operations)
• Ability to work on-site at the Islamabad I-9/3 office
• Stable internet awareness is helpful; floor systems and dialer training are provided

What we offer
• Competitive closer compensation tied to performance
• Campaign-specific training and floor coaching
• Clear path into Team Lead / leadership for strong performers
• Professional BPO environment across BALITECH’s Rawalpindi & Islamabad offices

Location: Islamabad Office (I-9/3 industrial area)
Arrangement: On-site
Schedule: Monday–Friday · 6:00 PM – 4:00 AM (US-aligned operations)`;

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

  // Upload career UI branch chips improvement
  for (const rel of [
    "src/lib/careers/career-board.ts",
    "src/components/career/CareerOpenings.tsx",
    "src/app/globals.css",
  ]) {
    console.log(">> put", rel);
    await ssh.putFile(path.join(ROOT, rel.replace(/\//g, path.sep)), `${SERVER.remoteDir}/${rel}`);
  }

  await run(
    ssh,
    "upsert FE Closer @ Islamabad I-9",
    `node <<'NODE'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const description = ${JSON.stringify(DESCRIPTION)};
(async () => {
  const offices = await p.office.findMany({ select: { name: true }, orderBy: { order: "asc" } });
  console.log("OFFICES", offices.map((o) => o.name));
  const i9 =
    offices.find((o) => /islamabad|i-?9/i.test(o.name))?.name ||
    "Islamabad Office";
  const campaigns = await p.campaign.findMany({ where: { isActive: true }, select: { title: true } });
  console.log("CAMPAIGNS", campaigns.map((c) => c.title));
  const campaignTitle =
    campaigns.find((c) => /final\\s*expense/i.test(c.title))?.title ||
    campaigns.find((c) => /final/i.test(c.title))?.title ||
    "Final Expense";

  const existing = await p.vacancy.findFirst({
    where: {
      OR: [
        { title: { contains: "FE Closer" } },
        { title: { contains: "Final Expense" }, AND: [{ title: { contains: "Closer" } }] },
      ],
    },
  });

  const data = {
    title: "FE Closer — Final Expense",
    department: "operations",
    roleGroups: JSON.stringify(["campaign", "english"]),
    branches: JSON.stringify([i9]),
    remoteAllowed: false,
    campaign: campaignTitle,
    workingDays: "Monday–Friday",
    workingHours: "6:00 PM – 4:00 AM",
    workArrangement: "On-site",
    cvRequired: false,
    customQuestion: "How many months of Final Expense or insurance closer experience do you have?",
    description,
    order: 1,
    isActive: true,
  };

  let row;
  if (existing) {
    row = await p.vacancy.update({ where: { id: existing.id }, data });
    console.log("UPDATED", row.id, row.title, row.branches);
  } else {
    row = await p.vacancy.create({ data });
    console.log("CREATED", row.id, row.title, row.branches);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
NODE`
  );

  await run(
    ssh,
    "build",
    "export NODE_OPTIONS=--max-old-space-size=3072; npm run build",
    { pty: true }
  );
  await run(ssh, "pm2 restart", `pm2 restart ${PM2_APP} --update-env`);
  await run(
    ssh,
    "verify career page",
    `sleep 3; curl -s http://127.0.0.1:${APP_PORT}/career | tr '"' '\\n' | grep -E 'FE Closer|Final Expense|Islamabad|I-9|career-job__branch' | sort | uniq | head -25`
  );

  ssh.dispose();
  console.log("\nOK — FE Closer listed on /career for Islamabad (I-9). Apply opens Join Us form.");
  console.log(`http://${SERVER.host}:${PROJECT_PORT}/career`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
