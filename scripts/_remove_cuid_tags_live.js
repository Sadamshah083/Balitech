/**
 * One-off: removes the garbage CUID-named blog tags from the database.
 *
 * Dry run (default):  node scripts/_remove_cuid_tags_live.js
 * Delete:             node scripts/_remove_cuid_tags_live.js --apply
 *
 * Matches a tag by either its id or its name. Deleting a tag also removes its
 * links to blogs and categories (ON DELETE CASCADE in prisma/schema.prisma).
 */
const { PrismaClient } = require("@prisma/client");

const GARBAGE = [
  "cmurklim100001aspcnmi59bm",
  "cmurklim900011aspqk0cprst",
  "cmurklimj00021asplgui5ehn",
  "cmurklimq00031asptt2k98hy",
  "cmurklimw00041aspsvsdzt7j",
  "cmurklin800051aspi2hdmb7u",
  "cmurklinf00061aspg4yuk61m",
  "cmurklink00071aspq4h14lof",
  "cmurklinq00081aspn9b0rg47",
  "cmurklinx00091asppff3cn3c",
  "cmurklio7000a1aspr2kro848",
  "cmurklioc000b1aspz89646vt",
  "cmurklipi000e1aspoesivbrz",
  "cmurklipq000f1aspvodnx01t",
  "cmurkliqg000g1asprnyz7lzj",
  "cmurklit4000s1asp2rkf4nd3",
  "cmurklitb000t1aspld6cwx4c",
  "cmurklith000u1aspiuwy1a65",
  "cmurklitm000v1aspfpqwjcyo",
  "cmurklitr000w1aspw271n2pc",
  "cmurklitx000x1aspzg7snnsh",
  "cmurkliu3000y1asph8g47etj",
  "cmurkliu8000z1asptdf1ti3j",
  "cmurkliue00101asp8g7aveoq",
  "cmurklium00111aspjm9nampe",
  "cmurkliuu00121aspno40k1rc",
  "cmurkliv200131aspxyyvfhln",
  "cmurkliwz001b1aspyogse44l",
  "cmurkliz1001k1aspv2ozn4ce",
  "cmurkliz6001l1asp9wsfoup3",
  "cmurklizi001m1asp28yh68ui",
  "cmurklizn001n1aspzst97bwo",
  "cmurklj0g001t1aspa599jtk4",
  "cmurklj1d001x1asp6cx0m9th",
  "cmurklj1i001y1aspf36st9jn",
  "cmurklj1n001z1aspzz3w51ab",
];

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  const where = { OR: [{ id: { in: GARBAGE } }, { name: { in: GARBAGE } }] };

  const found = await prisma.blogTag.findMany({
    where,
    select: {
      id: true,
      name: true,
      _count: { select: { blogs: true, categories: true } },
    },
  });

  /* Only tags whose name is itself a CUID are garbage. A real tag is never
     deleted just because its id appears in the list. */
  const matches = found.filter((tag) => /^c[a-z0-9]{20,}$/.test(tag.name));
  const skipped = found.length - matches.length;

  console.log(`Matched ${matches.length} of ${GARBAGE.length} listed values:`);
  if (skipped > 0) console.log(`Skipped ${skipped} real tag(s) whose name is not a CUID.`);
  for (const tag of matches) {
    console.log(
      `  ${tag.id}  name="${tag.name}"  blogs=${tag._count.blogs}  categories=${tag._count.categories}`
    );
  }

  if (!apply) {
    console.log("\nDry run. Nothing deleted. Run with --apply to delete these tags.");
    return;
  }

  const result = await prisma.blogTag.deleteMany({
    where: { id: { in: matches.map((tag) => tag.id) } },
  });
  console.log(`\nDeleted ${result.count} tags.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
