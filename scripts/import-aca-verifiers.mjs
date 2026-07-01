import fs from "node:fs";
import path from "node:path";

const assetsDir =
  "C:/Users/dev/.cursor/projects/c-Users-dev-Desktop-Balitech/assets";
const outDir = path.join(process.cwd(), "public", "awards", "aca-verifiers");

const catalog = [
  { srcKey: "ACA_VERIFIER11", slug: "aca-verifier-11", title: "Musadiq Hussain" },
  { srcKey: "ACA_VERIFEIR17", slug: "aca-verifier-17b", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER15", slug: "aca-verifier-15", title: "Ahmad Fareed" },
  { srcKey: "ACA_VERIFIER18", slug: "aca-verifier-18", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIERS2", slug: "aca-verifiers-2", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER-", slug: "aca-verifier", title: "Musharaf Islam", exact: "ACA_VERIFIER-" },
  { srcKey: "ACA_VERIFIER12", slug: "aca-verifier-12", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER19", slug: "aca-verifier-19", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER22", slug: "aca-verifier-22", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER23", slug: "aca-verifier-23", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER17", slug: "aca-verifier-17", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIERS13", slug: "aca-verifiers-13", title: "ACA Best Performer" },
  { srcKey: "ACA_VERIFIER25", slug: "aca-verifier-25", title: "Zain Ejaz" },
  { srcKey: "ACA_VERIFIERS7", slug: "aca-verifiers-7", title: "Umer Qadeer" },
  { srcKey: "ACA_VERIFIERS10", slug: "aca-verifiers-10", title: "Waqar Ahmed" },
  { srcKey: "ACA_VERIFIERS9", slug: "aca-verifiers-9", title: "Muhammad Umer" },
  { srcKey: "ACA_VERIFIERS6", slug: "aca-verifiers-6", title: "Muhib Ullah" },
  { srcKey: "ACA_VERIFIERS8", slug: "aca-verifiers-8", title: "Ahsan Ali" },
  { srcKey: "ACA_VERIFIERS14", slug: "aca-verifiers-14", title: "Abdul Wahab" },
  { srcKey: "ACA_VERIFIER20", slug: "aca-verifier-20", title: "Abdul Qadir" },
  { srcKey: "ACA_VERIFIER16", slug: "aca-verifier-16", title: "Mubasher Rizvi" },
  { srcKey: "ACA_VERIFIERS-", slug: "aca-verifiers", title: "Adil Mahmood", exact: "ACA_VERIFIERS-" },
  { srcKey: "ACA_VERIFIERS5", slug: "aca-verifiers-5", title: "Arslan Basharat" },
  { srcKey: "ACA_VERIFIERS_1", slug: "aca-verifiers-1", title: "Ahmad Fawad" },
  { srcKey: "ACA_VERIFIER24", slug: "aca-verifier-24", title: "Naseem Sajjad" },
  { srcKey: "ACA_VERIFIERS3", slug: "aca-verifiers-3", title: "Hassan Asif" },
  { srcKey: "ACA_VERIFIER21", slug: "aca-verifier-21", title: "Shehzad Ali" },
  { srcKey: "ACA_VERIFIERS4", slug: "aca-verifiers-4", title: "Saqlain Ahmed" },
];

function findAsset(srcKey, exact) {
  const files = fs.readdirSync(assetsDir);
  if (exact) {
    const marker = `images_${exact}`;
    return files.find((f) => f.includes(marker));
  }
  return files.find(
    (f) => f.includes(`images_${srcKey}-`) || f.includes(`images_${srcKey}_`)
  );
}

fs.mkdirSync(outDir, { recursive: true });

const imported = [];

for (const item of catalog) {
  const asset = findAsset(item.srcKey, item.exact);
  if (!asset) {
    console.warn("missing:", item.srcKey);
    continue;
  }
  const dest = path.join(outDir, `${item.slug}.png`);
  fs.copyFileSync(path.join(assetsDir, asset), dest);
  imported.push({
    id: item.slug,
    title: item.title,
    image: `/awards/aca-verifiers/${item.slug}.png`,
    alt: `${item.title} — ACA Self Verifiers Campaign Best Performer at BALITECH`,
  });
  console.log("copied", item.slug, "<-", asset.slice(-40));
}

fs.writeFileSync(
  path.join(process.cwd(), "src/lib/aca-self-verifiers.generated.json"),
  JSON.stringify(imported, null, 2)
);
console.log("total", imported.length);
