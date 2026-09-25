import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const BLOG_UPLOAD_DIR = path.join(process.cwd(), "uploads", "blogs");
export const BLOG_PUBLIC_PREFIX = "/uploads/blogs";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export function getImageExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isAllowedBlogImage(file: File) {
  const ext = getImageExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type) && file.type !== "") return false;
  return true;
}

export async function saveBlogImage(file: File) {
  if (file.size > MAX_BLOG_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  if (!isAllowedBlogImage(file)) {
    throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
  }

  const ext = getImageExtension(file.name) || ".jpg";
  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

  await mkdir(BLOG_UPLOAD_DIR, { recursive: true });
  const absolutePath = path.join(BLOG_UPLOAD_DIR, storedName);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    fileName: storedName,
    url: `${BLOG_PUBLIC_PREFIX}/${storedName}`,
  };
}
