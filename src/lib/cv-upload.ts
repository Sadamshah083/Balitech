import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const CV_UPLOAD_DIR = path.join(process.cwd(), "uploads", "cvs");

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB

export function getFileExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function isAllowedCvFile(file: File, extensions: ReadonlySet<string> = ALLOWED_EXTENSIONS) {
  /* The extension decides. Browsers and Windows report the same PDF/DOCX with
     many different MIME types (octet-stream, x-pdf, x-zip-compressed...), and
     rejecting those made valid CVs fail to submit. */
  return extensions.has(getFileExtension(file.name));
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

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(CV_UPLOAD_DIR, { recursive: true });
  const absolutePath = path.join(CV_UPLOAD_DIR, storedName);
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
