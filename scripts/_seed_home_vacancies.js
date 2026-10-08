/**
 * Local-only: seed 3 active vacancies so the home Open Vacancies cards can render.
 */
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

function slugify(title) {
  return (
    String(title || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 80) || "role"
  );
}

const seeds = [
  {
    title: "FE Closer — Final Expense",
    department: "operations",
    roleGroups: ["campaign", "english"],
    branches: ["Islamabad Office"],
    campaign: "Final Expense",
    description: [
      "FE Closer — Final Expense",
      "",
      "Role overview",
      "Close Final Expense policies on a live US-shift floor with coaching and clear targets.",
      "",
      "Key responsibilities",
      "• Run compliant closing conversations",
      "• Meet quality and productivity targets",
      "• Coordinate with verifiers and team leads",
      "",
      "Requirements",
      "• Clear spoken English",
      "• Comfortable with Monday–Friday US-aligned hours",
    ].join("\n"),
  },
  {
    title: "ACA — Verifier",
    department: "operations",
    roleGroups: ["campaign", "english"],
    branches: ["Shamsabad Office", "Islamabad Office"],
    campaign: "ACA",
    description: [
      "ACA — Verifier",
      "",
      "Role overview",
      "Verify ACA enrollments to campaign and compliance standards.",
      "",
      "Key responsibilities",
      "• Complete verification checklists accurately",
      "• Follow approved scripts and documentation",
      "• Escalate issues to your team lead",
      "",
      "Requirements",
      "• Campaign or BPO experience preferred",
      "• Strong attention to detail",
    ].join("\n"),
  },
  {
    title: "Dialer Executive",
    department: "it",
    roleGroups: ["it", "english"],
    branches: ["Shamsabad Office"],
    campaign: null,
    description: [
      "Dialer Executive",
      "",
      "Role overview",
      "Support dialer, CRM, and telephony across live US-shift operations.",
      "",
      "Key responsibilities",
      "• Configure and monitor dialer campaigns",
      "• Troubleshoot agent connectivity issues",
      "• Coordinate with IT and floor leads",
      "",
      "Requirements",
      "• Hands-on dialer / telephony experience preferred",
    ].join("\n"),
  },
];

async function main() {
  const existing = await p.vacancy.count({ where: { isActive: true } });
  if (existing >= 3) {
    console.log("Already have", existing, "active vacancies — skipping seed.");
    return;
  }

  let order = existing;
  for (const s of seeds) {
    const slug = slugify(s.title);
    const found = await p.vacancy.findFirst({ where: { slug } });
    if (found) {
      console.log("exists", slug);
      continue;
    }
    await p.vacancy.create({
      data: {
        title: s.title,
        slug,
        department: s.department,
        roleGroups: JSON.stringify(s.roleGroups),
        branches: JSON.stringify(s.branches),
        remoteAllowed: false,
        campaign: s.campaign,
        workingDays: "Monday–Friday",
        workingHours: "6:00 PM – 4:00 AM",
        workArrangement: "On-site",
        cvRequired: false,
        description: s.description,
        order: order++,
        isActive: true,
      },
    });
    console.log("created", slug);
  }
}

main()
  .then(() => p.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await p.$disconnect();
    process.exit(1);
  });
