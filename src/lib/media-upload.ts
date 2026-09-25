import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/* Outside public/: `next start` snapshots public/ at boot, so files written
   there later 404 until a restart. These are served by app/uploads/[...path]. */
export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const MEDIA_UPLOAD_DIR = path.join(UPLOADS_ROOT, "media");
export const MEDIA_PUBLIC_PREFIX = "/uploads/media";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const MAX_MEDIA_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_VIDEO_BYTES = 90 * 1024 * 1024;

export function getMediaExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function detectMediaKind(file: File): "image" | "video" | null {
  const ext = getMediaExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext) || IMAGE_MIME.has(file.type)) return "image";
  if (VIDEO_EXTENSIONS.has(ext) || VIDEO_MIME.has(file.type)) return "video";
  return null;
}

export async function saveMediaFile(file: File) {
  const kind = detectMediaKind(file);
  if (!kind) {
    throw new Error("Only JPG, PNG, WEBP, GIF, MP4, WEBM, and MOV files are allowed");
  }

  const max = kind === "video" ? MAX_MEDIA_VIDEO_BYTES : MAX_MEDIA_IMAGE_BYTES;
  if (file.size > max) {
    throw new Error(kind === "video" ? "Video must be 90MB or smaller" : "Image must be 10MB or smaller");
  }

  const ext = getMediaExtension(file.name) || (kind === "video" ? ".mp4" : ".jpg");
  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

  await mkdir(MEDIA_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_UPLOAD_DIR, storedName), Buffer.from(await file.arrayBuffer()));

  return { fileName: storedName, url: `${MEDIA_PUBLIC_PREFIX}/${storedName}`, kind };
}
