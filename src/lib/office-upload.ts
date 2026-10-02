import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { UPLOADS_ROOT } from "@/lib/media-upload";

export const OFFICE_UPLOAD_DIR = path.join(UPLOADS_ROOT, "offices");
export const OFFICE_PUBLIC_PREFIX = "/uploads/offices";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".bmp",
  ".heic",
  ".heif",
]);
const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/heic",
  "image/heif",
  "image/x-png",
  "image/pjpeg",
]);
export const MAX_OFFICE_IMAGE_BYTES = 10 * 1024 * 1024;

function extensionFromMime(mime: string) {
  switch (mime) {
    case "image/png":
    case "image/x-png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/bmp":
      return ".bmp";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    default:
      return ".jpg";
  }
}

export async function saveOfficeImage(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  const mime = (file.type || "").toLowerCase();
  const okExt = IMAGE_EXTENSIONS.has(ext);
  const okMime = IMAGE_MIME.has(mime) || mime.startsWith("image/");
  if (!okExt && !okMime) {
    throw new Error(
      "Only image files are allowed (JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP, HEIC)."
    );
  }
  if (file.size > MAX_OFFICE_IMAGE_BYTES) {
    throw new Error("Image must be 10MB or smaller");
  }

  const storedExt = okExt ? ext : extensionFromMime(mime);
  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${storedExt}`;

  await mkdir(OFFICE_UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(OFFICE_UPLOAD_DIR, storedName),
    Buffer.from(await file.arrayBuffer())
  );

  return {
    fileName: storedName,
    url: `${OFFICE_PUBLIC_PREFIX}/${storedName}`,
  };
}
