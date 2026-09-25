/**
 * Read-only look at the local Blog table, to tell "the table is empty" apart
 * from "the rows exist but are not published".
 *
 *   node scripts/_blog_rows.js
 *
 * Reads only. PRISMA_READONLY is set here as well so a stray write cannot
 * happen even if this file is edited later.
 */
process.env.PRISMA_READONLY = "1";
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

(async () => {
  const count = await prisma.blog.count();
  console.log(`\nblog rows: ${count}\n`);

  if (count > 0) {
    const rows = await prisma.blog.findMany({
      select: {
        title: true,
        slug: true,
        isPublished: true,
        order: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    for (const r of rows) {
      console.log(
        `   ${r.isPublished ? "published" : "DRAFT    "}  ${r.title?.slice(0, 54).padEnd(54)}  /${r.slug}`
      );
    }
    const live = rows.filter((r) => r.isPublished).length;
    console.log(`\n   ${live} of ${count} published\n`);
  }

  const offices = await prisma.office.count();
  const campaigns = await prisma.campaign.count();
  const active = await prisma.campaign.count({ where: { isActive: true } });
  const leads = await prisma.lead.count();
  const media = await prisma.mediaItem.count();
  console.log(
    `   offices ${offices}   campaigns ${campaigns} (${active} active)   leads ${leads}   media ${media}\n`
  );
})()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
