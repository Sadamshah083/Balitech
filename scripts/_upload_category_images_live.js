#!/usr/bin/env node
/**
 * Upload blog category images to the live server and assign them.
 *
 * Usage:
 *   1. Log in to the admin panel on the live site and copy your JWT token
 *      from sessionStorage (key: balitech_admin_jwt) or from the cookie.
 *   2. Run:  node scripts/_upload_category_images_live.js <token>
 *
 * The script uploads each image from media-src/blog-categories/ and then
 * PATCHes the matching category with the returned URL.
 */

const fs = require("fs"); // eslint-disable-line @typescript-eslint/no-require-imports
const path = require("path"); // eslint-disable-line @typescript-eslint/no-require-imports

const BASE_URL = process.env.BALITECH_URL || "https://balitech.org";
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error("Usage: node scripts/_upload_category_images_live.js <admin-jwt-token>");
  console.error("Get the token from sessionStorage (balitech_admin_jwt) after logging in.");
  process.exit(1);
}

const CATEGORY_IMAGES = [
  { slug: "technology", file: "technology.png", alt: "BaliTech developers working on code at their workstations" },
  { slug: "sales-lead-generation", file: "sales-lead-generation.png", alt: "BaliTech team reviewing documents and planning strategy" },
  { slug: "call-center-operations", file: "call-center-operations.png", alt: "BaliTech call center agent handling customer support" },
  { slug: "bpo-outsourcing", file: "bpo-outsourcing.png", alt: "BaliTech team in a business meeting discussing operations" },
  { slug: "careers-workplace", file: "careers-workplace.png", alt: "BaliTech employees collaborating and mentoring at their desk" },
  { slug: "balitech-insights", file: "balitech-insights.png", alt: "BaliTech team members in a standing discussion at the office" },
];

const IMG_DIR = path.join(__dirname, "..", "media-src", "blog-categories");

async function run() {
  // First, get all categories to find their IDs
  console.log("Fetching categories from", BASE_URL);
  const catRes = await fetch(`${BASE_URL}/api/blog-categories`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!catRes.ok) {
    console.error("Failed to fetch categories:", catRes.status, await catRes.text());
    process.exit(1);
  }
  const { categories } = await catRes.json();
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  for (const item of CATEGORY_IMAGES) {
    const category = bySlug[item.slug];
    if (!category) {
      console.warn(`Category "${item.slug}" not found, skipping`);
      continue;
    }

    const filePath = path.join(IMG_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Image not found: ${filePath}, skipping`);
      continue;
    }

    // Upload the image
    console.log(`Uploading ${item.file} for "${category.name}"...`);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: "image/png" });
    const form = new FormData();
    form.append("file", blob, item.file);

    const uploadRes = await fetch(`${BASE_URL}/api/blog-categories/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: form,
    });

    if (!uploadRes.ok) {
      console.error(`  Upload failed for ${item.file}:`, uploadRes.status, await uploadRes.text());
      continue;
    }

    const { url } = await uploadRes.json();
    console.log(`  Uploaded → ${url}`);

    // Patch the category with the image URL and alt text
    const patchRes = await fetch(`${BASE_URL}/api/blog-categories/${category.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: url, imageAlt: item.alt }),
    });

    if (!patchRes.ok) {
      console.error(`  PATCH failed for ${item.slug}:`, patchRes.status, await patchRes.text());
      continue;
    }

    console.log(`  ✓ ${category.name} updated with image`);
  }

  console.log("\nDone! Category images assigned.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
