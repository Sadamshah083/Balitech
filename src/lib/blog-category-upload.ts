import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const CATEGORY_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "blog-categories"
);
export const CATEGORY_PUBLIC_PREFIX = "/uploads/blog-categories";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/pjpeg",
  "image/x-png",
]);

export const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024;

export function getCategoryImageExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isAllowedCategoryImage(file: File) {
  const ext = getCategoryImageExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type) && file.type !== "application/octet-stream") {
    return false;
  }
  return true;
}

function sniffImageExt(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return ".png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }
  if (buffer.length >= 6) {
    const gif = buffer.toString("ascii", 0, 6);
    if (gif === "GIF87a" || gif === "GIF89a") return ".gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp"
  ) {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return ".avif";
  }
  return null;
}

export async function saveCategoryImage(file: File) {
  if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  if (!isAllowedCategoryImage(file)) {
    throw new Error("Only JPG, JPEG, PNG, WEBP, AVIF, and GIF images are allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageExt(buffer);
  if (!sniffed) {
    throw new Error("File content is not a valid image. Please upload a real JPG, PNG, WEBP, AVIF, or GIF.");
  }

  const nameExt = getCategoryImageExtension(file.name);
  if (nameExt && nameExt !== sniffed && !(nameExt === ".jpeg" && sniffed === ".jpg")) {
    throw new Error("File extension does not match the image contents.");
  }

  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${sniffed}`;

  await mkdir(CATEGORY_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(CATEGORY_UPLOAD_DIR, storedName), buffer);

  return {
    fileName: storedName,
    url: `${CATEGORY_PUBLIC_PREFIX}/${storedName}`,
  };
}
