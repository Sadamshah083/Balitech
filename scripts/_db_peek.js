/** Read-only look at the local campaign table.  node scripts/_db_peek.js */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  const count = await prisma.campaign.count();
  console.log(`campaign rows: ${count}`);

  if (count > 0) {
    const rows = await prisma.campaign.findMany({
      orderBy: { order: "asc" },
      select: { title: true, order: true, isActive: true, location: true },
    });
    for (const r of rows) {
      console.log(
        `  ${String(r.order).padStart(3)}  ${r.isActive ? "active" : "hidden"}  ${r.title}  (${r.location})`
      );
    }
  }

  const admins = await prisma.admin.count();
  console.log(`admin rows: ${admins}`);
})()
  .catch((e) => console.error(`DB error: ${String(e.message).split("\n")[0]}`))
  .finally(() => prisma.$disconnect());
