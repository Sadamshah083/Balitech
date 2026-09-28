import { prisma } from "@/lib/prisma";
import { BLOG_LIMITS, slugify } from "@/lib/blog";

/**
 * A slug no other post uses. A title that repeats an earlier one gets "-2",
 * "-3" and so on, instead of the save failing on the unique index.
 */
export async function uniqueBlogSlug(
  requested: string | null | undefined,
  title: string,
  excludeId?: string
) {
  const base =
    slugify(requested?.trim() || "") ||
    slugify(title) ||
    `post-${Date.now().toString(36)}`;

  let candidate = base;
  for (let n = 2; n < 200; n++) {
    const taken = await prisma.blog.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!taken) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

type BlogFields = {
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  image?: unknown;
  tags?: unknown;
};

const bytes = (value: string) => Buffer.byteLength(value, "utf8");

/** A message naming the first field that will not fit its column, or null. */
export function blogFieldError(fields: BlogFields): string | null {
  const text = (value: unknown) =>
    value === undefined || value === null ? "" : String(value).trim();

  const title = text(fields.title);
  if (title.length > BLOG_LIMITS.title) {
    return `Title is too long (${title.length} characters). Keep it under ${BLOG_LIMITS.title}.`;
  }

  const content = text(fields.content);
  if (bytes(content) > BLOG_LIMITS.contentBytes) {
    const kb = Math.ceil(bytes(content) / 1024);
    return `Content is too large (${kb} KB, the limit is 64 KB). Pictures pasted into the text are the usual cause: remove them and use the cover image upload instead, or split the article into two posts.`;
  }

  if (bytes(text(fields.excerpt)) > BLOG_LIMITS.excerptBytes) {
    return "Excerpt is too long. Keep it to a short summary.";
  }

  if (text(fields.image).length > BLOG_LIMITS.image) {
    return `Cover image address is too long. Upload the image from your PC instead of pasting a link.`;
  }

  if (text(fields.tags).length > BLOG_LIMITS.tags) {
    return "Too many tags. Remove a few, or use shorter ones.";
  }

  return null;
}
