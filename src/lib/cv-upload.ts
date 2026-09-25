import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const CV_UPLOAD_DIR = path.join(process.cwd(), "uploads", "cvs");

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB

export function getFileExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isAllowedCvFile(file: File, extensions: ReadonlySet<string> = ALLOWED_EXTENSIONS) {
  const ext = getFileExtension(file.name);
  if (!extensions.has(ext)) return false;
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    // Some browsers send empty MIME — still allow by extension
    if (file.type !== "") return false;
  }
  return true;
}

export function sanitizeOriginalFilename(filename: string) {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function saveLeadCv(
  file: File,
  options: { extensions?: ReadonlySet<string>; typeError?: string } = {}
) {
  if (file.size > MAX_CV_BYTES) {
    throw new Error("CV file must be 5MB or smaller");
  }
  if (!isAllowedCvFile(file, options.extensions)) {
    throw new Error(options.typeError ?? "Only PDF, DOC, and DOCX files are allowed");
  }

  const originalName = sanitizeOriginalFilename(file.name) || "cv.pdf";
  const ext = getFileExtension(originalName) || ".pdf";
  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;

  await mkdir(CV_UPLOAD_DIR, { recursive: true });
  const absolutePath = path.join(CV_UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    cvFileName: originalName,
    cvPath: storedName,
  };
}

export function resolveCvAbsolutePath(storedName: string) {
  const safeName = path.basename(storedName);
  return path.join(CV_UPLOAD_DIR, safeName);
}
