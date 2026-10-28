/**
 * Fill empty Blog.imageAlt on live with a description of each cover picture.
 * Only updates blogs whose imageAlt is empty; touches nothing else.
 *   node scripts/_blog_alt_live.js
 */
const fs = require("fs"), os = require("os"), path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

const ALT = {
  "balitech-a-growing-bpo-call-center-in-rawalpindi-islamabad":
    "BaliTech call center agents with headsets at their desks, with the Islamabad skyline at sunset behind them and the title A Growing BPO & Call Center in Rawalpindi and Islamabad.",
  "best-call-centers-in-rawalpindi-and-islamabad-services-careers-what-to-look-for":
    "Smiling BaliTech agents wearing headsets in a bright call center overlooking Islamabad, with the title Best Call Centers in Rawalpindi and Islamabad.",
  "customer-support-services-in-rawalpindi-and-islamabad-the-balitech-approach":
    "Two BaliTech customer support agents with headsets at a computer while a colleague guides them, with the title Customer Support Services in Rawalpindi and Islamabad.",
  "bpo-careers-in-rawalpindi-and-islamabad-jobs-skills-growth-opportunities-at-balitech":
    "BaliTech team leader speaking to job candidates around a table with resumes and laptops, with the title BPO Careers in Rawalpindi and Islamabad.",
  "career-opportunities-at-balitech-jobs-growth-life-at-a-modern-bpo":
    "BaliTech colleagues gathered around a laptop in a glass-walled office, with the title Career Opportunities at BaliTech.",
  "inside-a-modern-bpo-people-technology-and-operations-behind-the-work":
    "Rows of BaliTech agents working at computers on a large call center floor, with the title Inside a Modern BPO.",
  "how-call-center-technology-supports-modern-bpo-operations":
    "BaliTech team in a meeting around a long conference table with laptops, with the title How Call Center Technology Supports Modern BPO Operations.",
  "behind-balitechs-sales-pipeline-how-lead-generation-outreach-and-people-work-together":
    "BaliTech team members in a meeting room discussing sales strategy, with the title Behind BaliTech's Sales Pipeline.",
  "aca-medicare-campaign-careers-skills-and-growth-at-balitech-3":
    "Agents working at their desks on the BaliTech call center floor, with the title ACA & Medicare Campaign Careers, Skills and Growth at BaliTech.",
  "best-call-center-for-aca-medicare-sales-and-closers":
    "Agents with headsets at cubicles on the BaliTech call center floor and a team meeting in the corner, with the title Best Call Center for ACA & Medicare Sales and Closers.",
  "call-center-in-rawalpindi-and-islamabad-jobs-and-career-opportunities-at-balitech":
    "BaliTech employees in a team meeting and working at desks in the call center, with the title Call Center in Rawalpindi & Islamabad, Jobs and Career Opportunities.",
  "night-shift-call-center-jobs-in-rawalpindi-careers-skills-and-growth":
    "BaliTech staff in a team meeting beside the Think Bigger wall of the call center, with the title Night Shift Call Center Jobs in Rawalpindi.",
  "what-job-seekers-should-know-about-balitech":
    "A BaliTech employee working at his computer in the office, with the title What Job Seekers Should Know About BaliTech.",
  "how-balitech-is-building-professional-talent":
    "BaliTech team in a training meeting with the call center floor and reception desk in the background, with the title How BaliTech Is Building Professional Talent.",
  "the-teams-and-expertise-behind-balitechs-growth":
    "BaliTech agents at their workstations under the I am at BaliTech sign, with a group photo of the team, titled The Teams and Expertise Behind BaliTech's Growth.",
  "how-balitech-maintains-quality-across-call-center-operations":
    "BaliTech agents with headsets at workstations in the call center, with a quality assurance score panel and the title How BaliTech Maintains Quality Across Call Center Operations.",
  "medical-billing-at-balitech-skills-standards-and-growth":
    "BaliTech medical billing team members reviewing records on a computer, with document, search and checklist icons and the title Medical Billing at BaliTech.",
};

const REMOTE_JS = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ALT = ${JSON.stringify(ALT)};
(async () => {
  const blogs = await prisma.blog.findMany({ select: { id:true, slug:true, imageAlt:true, image:true } });
  const out = [];
  for (const b of blogs) {
    if (!b.image) { out.push([b.slug, "no-image"]); continue; }
    if (b.imageAlt && b.imageAlt.trim()) { out.push([b.slug, "kept"]); continue; }
    const alt = ALT[b.slug];
    if (!alt) { out.push([b.slug, "NO-MAPPING"]); continue; }
    await prisma.blog.update({ where: { id: b.id }, data: { imageAlt: alt.slice(0, 180) }, select: { id: true } });
    out.push([b.slug, "updated"]);
  }
  console.log(JSON.stringify(out, null, 1));
  await prisma.$disconnect();
})();`;

(async () => {
  const lt = path.join(os.tmpdir(), "bt-alt-fill.js"), rt = "/tmp/bt-alt-fill.js";
  fs.writeFileSync(lt, REMOTE_JS);
  const ssh = new NodeSSH(); await ssh.connect(SERVER);
  await ssh.putFile(lt, rt);
  const r = await ssh.execCommand(`NODE_PATH=${SERVER.remoteDir}/node_modules node ${rt}`, { cwd: SERVER.remoteDir });
  console.log(r.stdout); if (r.stderr) console.error(r.stderr);
  await ssh.execCommand(`rm -f ${rt}`); ssh.dispose();
})();
