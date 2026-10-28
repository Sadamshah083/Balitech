/** Read-only: list live blog cover images, alt text and <img> tags in content. */
const fs = require("fs"), os = require("os"), path = require("path");
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");
const REMOTE_JS = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const blogs = await prisma.blog.findMany({ select: { id:true, slug:true, title:true, image:true, imageAlt:true, content:true, category:{select:{name:true}} }, orderBy:{createdAt:"asc"} });
  for (const b of blogs) {
    const imgs = (b.content.match(/<img\\b[^>]*>/gi) || []);
    console.log(JSON.stringify({ id:b.id, slug:b.slug, title:b.title, cat:b.category&&b.category.name, image:b.image, imageAlt:b.imageAlt, contentImgs: imgs }));
  }
  const cats = await prisma.blogCategory.findMany({ select:{slug:true,image:true,imageAlt:true} });
  console.log("CATS", JSON.stringify(cats));
  await prisma.$disconnect();
})();`;
(async () => {
  const lt = path.join(os.tmpdir(), "bt-alt-audit.js"), rt = "/tmp/bt-alt-audit.js";
  fs.writeFileSync(lt, REMOTE_JS);
  const ssh = new NodeSSH(); await ssh.connect(SERVER);
  await ssh.putFile(lt, rt);
  const r = await ssh.execCommand(`NODE_PATH=${SERVER.remoteDir}/node_modules node ${rt}`, { cwd: SERVER.remoteDir });
  console.log(r.stdout); if (r.stderr) console.error(r.stderr);
  await ssh.execCommand(`rm -f ${rt}`); ssh.dispose();
})();
