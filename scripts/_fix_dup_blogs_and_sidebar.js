/**
 * 1) Soft-unpublish duplicate ACA blogs (keep one).
 * 2) Confirm remaining published rows.
 * Does not delete; sets status to draft for extras.
 */
const { NodeSSH } = require("node-ssh");
const { SERVER } = require("./deploy-config");

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect(SERVER);

  const list = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && node -e `
    + JSON.stringify(`
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const rows=await p.blog.findMany({
    where:{ OR:[
      {slug:{contains:'aca-medicare'}},
      {title:{contains:'ACA & Medicare'}}
    ]},
    orderBy:[{publishedAt:'asc'},{id:'asc'}],
    select:{id:true,slug:true,title:true,status:true,publishedAt:true}
  });
  console.log(JSON.stringify(rows,null,2));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
`)
  );
  console.log("MATCHING BLOGS:\n" + (list.stdout || list.stderr));

  const fix = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && node -e `
    + JSON.stringify(`
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  const rows=await p.blog.findMany({
    where:{
      status:'published',
      OR:[
        {slug:{startsWith:'aca-medicare-campaign-careers-skills-and-growth-at-balitech'}},
        {title:{startsWith:'ACA & Medicare Campaign'}}
      ]
    },
    orderBy:[{publishedAt:'asc'},{id:'asc'}],
    select:{id:true,slug:true,title:true,status:true}
  });
  if(rows.length<=1){
    console.log(JSON.stringify({kept:rows,unpublished:[]},null,2));
    await p.$disconnect();
    return;
  }
  const keep=rows[0];
  const extras=rows.slice(1);
  for(const r of extras){
    await p.blog.update({where:{id:r.id},data:{status:'draft'}});
  }
  console.log(JSON.stringify({kept:keep,unpublished:extras.map(x=>x.id)},null,2));
  await p.$disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
`)
  );
  console.log("FIX:\n" + (fix.stdout || fix.stderr));
  if (fix.code !== 0) throw new Error("fix failed");

  // Refresh public blog page so SSG cache drops duplicates
  const refresh = await ssh.execCommand(
    `cd ${SERVER.remoteDir} && node -e `
    + JSON.stringify(`
const {PrismaClient}=require('@prisma/client');
(async()=>{
  try {
    const mod=await import('./src/lib/refresh-public-pages.ts').catch(()=>null);
  } catch {}
  // hit revalidate via curl to local app if available
})();
`) ,
    { cwd: SERVER.remoteDir }
  );

  const curl = await ssh.execCommand(
    `curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3005/api/blogs -H 'Content-Type: application/json' || true; echo; curl -s http://127.0.0.1:3080/blog | grep -o 'aca-medicare-campaign-careers-skills-and-growth-at-balitech[^\"'\'']*' | sort | uniq -c`
  );
  console.log("SLUG COUNTS ON /blog:\n" + (curl.stdout || curl.stderr));

  ssh.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
