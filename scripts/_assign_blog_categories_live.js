/**
 * Assign each live Blog to a relevant BlogCategory by slug.
 * Updates categoryId (+ recommended category tags on the post) only.
 * Does not create/delete blogs or copy from local DB.
 *
 *   node scripts/_assign_blog_categories_live.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

/** blog slug → category slug */
const ASSIGNMENTS = {
  "inside-a-modern-bpo-people-technology-and-operations-behind-the-work":
    "bpo-outsourcing",
  "career-opportunities-at-balitech-jobs-growth-life-at-a-modern-bpo":
    "careers-workplace",
  "bpo-careers-in-rawalpindi-and-islamabad-jobs-skills-growth-opportunities-at-balitech":
    "careers-workplace",
  "best-call-centers-in-rawalpindi-and-islamabad-services-careers-what-to-look-for":
    "call-center-operations",
  "customer-support-services-in-rawalpindi-and-islamabad-the-balitech-approach":
    "call-center-operations",
  "balitech-a-growing-bpo-call-center-in-rawalpindi-islamabad":
    "balitech-insights",
};

const REMOTE_JS = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ASSIGNMENTS = ${JSON.stringify(ASSIGNMENTS, null, 2)};
(async () => {
  const cats = await prisma.blogCategory.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const blogs = await prisma.blog.findMany({
    select: { id: true, slug: true, title: true, categoryId: true },
    orderBy: { createdAt: "asc" },
  });
  const results = [];
  for (const blog of blogs) {
    const catSlug = ASSIGNMENTS[blog.slug];
    if (!catSlug) {
      results.push({ slug: blog.slug, status: "no-mapping" });
      continue;
    }
    const cat = bySlug[catSlug];
    if (!cat) {
      results.push({ slug: blog.slug, status: "missing-category", catSlug });
      continue;
    }
    if (blog.categoryId === cat.id) {
      results.push({ slug: blog.slug, status: "already", category: cat.slug });
      continue;
    }
    await prisma.blog.update({
      where: { id: blog.id },
      data: { categoryId: cat.id },
    });
    results.push({ slug: blog.slug, status: "updated", category: cat.slug });
  }
  const withCat = await prisma.blog.count({ where: { categoryId: { not: null } } });
  console.log(JSON.stringify({ ok: true, total: blogs.length, withCategory: withCat, results }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
`;

async function main() {
  const localTmp = path.join(os.tmpdir(), "balitech-assign-blog-cats.js");
  const remoteTmp = "/tmp/balitech-assign-blog-cats.js";
  fs.writeFileSync(localTmp, REMOTE_JS, "utf8");

  const ssh = new NodeSSH();
  await ssh.connect(SERVER);
  try {
    await ssh.putFile(localTmp, remoteTmp);
    const res = await ssh.execCommand(
      `NODE_PATH=${SERVER.remoteDir}/node_modules node ${remoteTmp}`,
      { cwd: SERVER.remoteDir }
    );
    if (res.stdout) console.log(res.stdout.trim());
    if (res.stderr) console.error(res.stderr.trim());
    if (res.code !== 0) process.exit(res.code || 1);
  } finally {
    await ssh.execCommand(`rm -f ${remoteTmp}`);
    ssh.dispose();
    fs.unlinkSync(localTmp);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
