import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { UPLOADS_ROOT } from "@/lib/media-upload";

export const runtime = "nodejs";

/* CVs also live under uploads/ and must never be publicly reachable. */
const PUBLIC_FOLDERS = new Set(["media", "blogs"]);

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  if (segments.length !== 2 || !PUBLIC_FOLDERS.has(segments[0])) {
    return new Response("Not found", { status: 404 });
  }

  const fileName = path.basename(segments[1]);
  const contentType = CONTENT_TYPES[path.extname(fileName).toLowerCase()];
  if (!contentType) return new Response("Not found", { status: 404 });

  const absolutePath = path.join(UPLOADS_ROOT, segments[0], fileName);
  let size: number;
  try {
    size = (await stat(absolutePath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  /* Browsers need byte ranges to seek and to start video playback. */
  const range = request.headers.get("range");
  const match = range?.match(/bytes=(\d*)-(\d*)/);
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(absolutePath, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(absolutePath)) as ReadableStream;
  return new Response(stream, {
    headers: { ...headers, "Content-Length": String(size) },
  });
}
