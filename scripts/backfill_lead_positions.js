/**
 * Copies the job title out of the legacy "Position: <label>" message line into
 * the dedicated Lead.position column. Safe to run repeatedly.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function extractPosition(message) {
  if (!message) return null;
  const match = message.match(/^\s*Position:\s*(.+)$/im);
  return match && match[1] ? match[1].trim() : null;
}

async function main() {
  const leads = await prisma.lead.findMany({
    where: { OR: [{ position: null }, { position: "" }] },
    select: { id: true, message: true },
  });

  let updated = 0;
  for (const lead of leads) {
    const position = extractPosition(lead.message);
    if (!position) continue;
    await prisma.lead.update({
      where: { id: lead.id },
      data: { position },
    });
    updated += 1;
  }

  console.log(
    `Backfill complete: ${updated} of ${leads.length} lead(s) received a job title.`
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
