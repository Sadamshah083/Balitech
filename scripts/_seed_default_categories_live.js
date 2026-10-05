/**
 * Upserts the six BlogCategory rows on live with SEO fields + recommended tags.
 * Renames technology-crm → technology (and sales-lead-generation-b2b →
 * sales-lead-generation) with BlogCategoryRedirect rows.
 *
 * Does NOT touch Blog rows or copy anything from the local database.
 *
 *   node scripts/_seed_default_categories_live.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const DEFAULTS = [
  {
    name: "BPO & Outsourcing",
    slug: "bpo-outsourcing",
    formerSlugs: [],
    metaTitle: "BPO & Outsourcing Services in Pakistan | BaliTech Insights",
    metaDescription:
      "Explore BaliTech insights on BPO services in Pakistan, business process outsourcing, dedicated teams and outsourcing operations in Rawalpindi and Islamabad.",
    order: 1,
    description: `BPO & Outsourcing brings together BaliTech articles for businesses that want to understand how business process outsourcing works in practice. Here, readers can explore topics around BPO services in Pakistan, dedicated teams, outsourced business processes, operational scaling and the role of a professional BPO company in Rawalpindi or Islamabad.

The focus is practical rather than theoretical. Articles in this category explain how companies can outsource customer-facing and back-office work, how managed BPO teams are built, and what businesses should consider before moving a process outside their internal operation.

For organizations researching BPO in Rawalpindi, BPO in Islamabad or broader business process outsourcing in Pakistan, this section provides a clearer view of how people, processes, management and technology come together inside a working BPO environment.`,
    tags: [
      "BPO Services Pakistan",
      "BPO Company Rawalpindi",
      "BPO Company Islamabad",
      "Business Process Outsourcing",
      "Outsourcing Services Pakistan",
      "BPO in Rawalpindi",
      "BPO in Islamabad",
      "International BPO Services",
      "Dedicated BPO Teams",
      "Back Office Outsourcing",
      "Business Process Support",
      "Medical Billing Outsourcing",
    ],
  },
  {
    name: "Call Center Operations",
    slug: "call-center-operations",
    formerSlugs: [],
    metaTitle: "Call Center Operations in Rawalpindi & Islamabad | BaliTech",
    metaDescription:
      "Read BaliTech insights on call center operations, inbound and outbound services, QA and international campaigns in Rawalpindi and Islamabad.",
    order: 2,
    description: `Call Center Operations covers the people, processes and management behind professional inbound and outbound campaigns. Readers researching a call center in Rawalpindi, a call center in Islamabad or comparing the best call centers in Rawalpindi and Islamabad can use this section to understand what actually separates one operation from another.

The articles go beyond the number of agents on a floor. They look at inbound customer handling, outbound calling, campaign management, quality assurance, verification, training, reporting and international call center operations.

For someone searching for the best call center in Rawalpindi, best call center in Islamabad or even the best call center in Pakistan, the useful question is not simply who uses the word “best.” It is how the operation is structured, how teams are managed and how performance and quality are monitored.`,
    tags: [
      "Call Center Rawalpindi",
      "Call Center Islamabad",
      "Best Call Center Rawalpindi",
      "Best Call Center Islamabad",
      "Best Call Center Pakistan",
      "Call Center Near Me",
      "Inbound Call Center",
      "Outbound Call Center",
      "International Call Center",
      "Customer Support",
      "Call Center QA",
      "Call Center Operations",
    ],
  },
  {
    name: "Technology",
    slug: "technology",
    formerSlugs: ["technology-crm"],
    metaTitle: "BPO & Call Center Technology, IT and Software | BaliTech",
    metaDescription:
      "Explore BaliTech content on BPO technology, IT, call center software, CRM, dialers, automation, reporting and development supporting modern operations.",
    order: 3,
    description: `Technology has become part of the everyday operation of a modern BPO. This category explores the systems and technical work behind call centers, customer operations and growing business teams, from call center software, CRM platforms and dialers to telephony, reporting, automation, infrastructure and internal development.

The focus is not technology for its own sake. It is about how technology supports real BPO work. A CRM helps teams manage information, dialers support outbound operations, reporting gives managers visibility, and IT teams help keep the environment available when live campaigns depend on it.

This section also creates a natural home for content around BPO technology, call center technology, IT in BPO, software development and technical careers. For people researching IT jobs in Rawalpindi, IT jobs in Islamabad, developer roles or technology positions, it also shows how technical skills can connect with modern business operations.

BaliTech’s live service content already discusses CRM, dialer and telephony configuration as part of campaign delivery, so Technology is a genuine extension of its BPO positioning rather than a separate identity being forced onto the company.`,
    tags: [
      "Call Center Technology",
      "BPO Technology",
      "CRM in Call Centers",
      "Call Center CRM",
      "Call Center Software",
      "Call Center Dialer",
      "Dialer Technology",
      "Call Center Automation",
      "BPO Automation",
      "Call Center Reporting",
      "IT in BPO",
      "Technical Support BPO",
    ],
  },
  {
    name: "Sales, Lead Generation & B2B",
    slug: "sales-lead-generation",
    formerSlugs: ["sales-lead-generation-b2b"],
    metaTitle: "Lead Generation, B2B Outreach & Sales | BaliTech Insights",
    metaDescription:
      "Explore BaliTech articles on lead generation, B2B outreach, appointment setting, sales outsourcing, prospect qualification and verification.",
    order: 4,
    description: `Sales, Lead Generation & B2B focuses on the work that happens before and around a sales conversation. The articles in this category explore lead generation services, B2B outreach, appointment setting, outbound prospecting, lead qualification, sales support and verification.

These topics are closely connected, but they are not the same process. Lead generation may focus on identifying and qualifying suitable prospects, while B2B outreach can involve defined account lists, decision-maker research and structured contact sequences. Appointment setting takes that process another step by turning qualified conversations into scheduled opportunities for a sales team.

For businesses considering sales outsourcing, B2B lead generation or outsourced prospecting, this category explains how teams, processes, scripts, qualification criteria and reporting work together to build a more organized pipeline.

BaliTech’s current B2B service information specifically distinguishes account-focused outreach from broader lead generation, which supports keeping this category commercially focused.`,
    tags: [
      "Lead Generation Services",
      "B2B Lead Generation",
      "Lead Generation Pakistan",
      "B2B Outreach",
      "Appointment Setting",
      "Outbound Prospecting",
      "Qualified Leads",
      "Lead Qualification",
      "Sales Outsourcing",
      "Sales Verification",
      "Sales Pipeline",
      "Decision Maker Outreach",
    ],
  },
  {
    name: "Careers & Workplace",
    slug: "careers-workplace",
    formerSlugs: [],
    metaTitle: "BPO, Call Center & IT Jobs in Rawalpindi Islamabad | BaliTech",
    metaDescription:
      "Explore BaliTech career content on BPO jobs, call center jobs, IT careers, training and professional opportunities across Rawalpindi and Islamabad.",
    order: 5,
    description: `Careers & Workplace is for people exploring professional opportunities across BPO, call center operations, technology and business support. The category covers call center jobs in Rawalpindi, call center jobs in Islamabad, BPO careers, training, professional growth and the wider range of roles that support a modern operation.

Not every career inside a BPO begins and ends with an agent position. Quality assurance, training, team leadership, operations, HR, recruitment and technology all contribute to the work behind live campaigns. As BPO operations become more technology-supported, searches for IT jobs in Rawalpindi, IT jobs in Islamabad, developer jobs and technical careers also become relevant to the wider employment landscape.

Readers searching for call center jobs near me, BPO jobs Rawalpindi, professional opportunities or current BaliTech vacancies should always check the live Careers section because available positions can change over time.

The current BaliTech website presents both fresher and experienced career pathways and operates across Rawalpindi and Islamabad.`,
    tags: [
      "Call Center Jobs Rawalpindi",
      "Call Center Jobs Islamabad",
      "BPO Jobs Rawalpindi",
      "BPO Jobs Islamabad",
      "IT Jobs Rawalpindi",
      "IT Jobs Islamabad",
      "Developer Jobs Rawalpindi",
      "Developer Jobs Islamabad",
      "BPO Careers",
      "Call Center Careers",
      "Jobs for Freshers",
      "Technology Careers",
    ],
  },
  {
    name: "BaliTech Insights",
    slug: "balitech-insights",
    formerSlugs: [],
    metaTitle: "BaliTech News, Workplace & Company Insights | Rawalpindi Islamabad",
    metaDescription:
      "Explore BaliTech company insights, workplace stories, professional growth, offices, culture and updates from Rawalpindi and Islamabad.",
    order: 6,
    description: `BaliTech Insights brings together stories about the company, its people, workplaces and growth across Rawalpindi and Islamabad. This is where readers can learn more about life inside BaliTech beyond individual services or job descriptions.

Articles may cover workplace culture, training, employee development, company milestones, recognition, office activity and the people behind the operation. The purpose is to give clients, professionals and job seekers a clearer picture of the organization they are researching.

For people searching for BaliTech Rawalpindi, BaliTech Islamabad, careers at BaliTech or information about a growing BPO company in Rawalpindi and Islamabad, this category provides the company-side context that service pages cannot always show.

BaliTech currently operates four physical offices across Rawalpindi and Islamabad, making location, workplace and organizational content a meaningful part of the company’s wider online presence.`,
    tags: [
      "Life at BaliTech",
      "BaliTech Rawalpindi",
      "BaliTech Islamabad",
      "BaliTech Careers",
      "BaliTech Culture",
      "Employee Recognition",
      "Employee Training",
      "Professional Growth",
      "BPO Workplace",
      "Company Growth",
      "Office Life",
      "Team Development",
    ],
  },
];

const REMOTE_JS = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DEFAULTS = ${JSON.stringify(DEFAULTS, null, 2)};
function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^\\w\\s-]/g, "").replace(/[\\s_]+/g, "-").replace(/-+/g, "-");
}
async function ensureTag(name) {
  const clean = String(name).trim().replace(/\\s+/g, " ");
  const slug = slugify(clean);
  let tag = await prisma.blogTag.findUnique({ where: { slug } });
  if (!tag) tag = await prisma.blogTag.create({ data: { name: clean, slug } });
  return tag.id;
}
(async () => {
  const blogCountBefore = await prisma.blog.count();
  const summary = [];
  for (const item of DEFAULTS) {
    let category = await prisma.blogCategory.findUnique({ where: { slug: item.slug } });
    if (!category) {
      for (const oldSlug of item.formerSlugs || []) {
        const former = await prisma.blogCategory.findUnique({ where: { slug: oldSlug } });
        if (former) {
          category = await prisma.blogCategory.update({
            where: { id: former.id },
            data: { slug: item.slug },
          });
          await prisma.blogCategoryRedirect.upsert({
            where: { oldSlug },
            create: { oldSlug, categoryId: former.id },
            update: { categoryId: former.id },
          });
          break;
        }
      }
    }
    if (category) {
      category = await prisma.blogCategory.update({
        where: { id: category.id },
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          order: item.order,
          isActive: true,
        },
      });
    } else {
      category = await prisma.blogCategory.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          order: item.order,
          isActive: true,
        },
      });
    }
    for (const oldSlug of item.formerSlugs || []) {
      if (oldSlug === item.slug) continue;
      await prisma.blogCategoryRedirect.upsert({
        where: { oldSlug },
        create: { oldSlug, categoryId: category.id },
        update: { categoryId: category.id },
      });
    }
    const tagIds = [];
    for (const tagName of item.tags) tagIds.push(await ensureTag(tagName));
    await prisma.blogCategoryTag.deleteMany({ where: { categoryId: category.id } });
    if (tagIds.length) {
      await prisma.blogCategoryTag.createMany({
        data: tagIds.map((tagId) => ({ categoryId: category.id, tagId })),
        skipDuplicates: true,
      });
    }
    summary.push({ slug: category.slug, tags: tagIds.length });
  }
  const blogCountAfter = await prisma.blog.count();
  const blogsWithCategory = await prisma.blog.count({ where: { categoryId: { not: null } } });
  const categories = await prisma.blogCategory.count();
  const tags = await prisma.blogTag.count();
  const redirects = await prisma.blogCategoryRedirect.findMany({ select: { oldSlug: true } });
  console.log(JSON.stringify({
    ok: true,
    categories,
    tags,
    blogCountBefore,
    blogCountAfter,
    blogsUntouched: blogCountBefore === blogCountAfter,
    blogsWithCategory,
    redirects: redirects.map((r) => r.oldSlug),
    summary,
  }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
`;

async function main() {
  const localTmp = path.join(os.tmpdir(), "balitech-seed-categories.js");
  const remoteTmp = "/tmp/balitech-seed-categories.js";
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
