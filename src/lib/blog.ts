export type BlogFormat = "standard" | "featured" | "compact";

export const blogFormatOptions: { value: BlogFormat; label: string }[] = [
  { value: "standard", label: "Standard Card" },
  { value: "featured", label: "Featured (Large)" },
  { value: "compact", label: "Compact List" },
];

/** Longest slug we generate; the column holds 191, leaving room for "-2". */
const SLUG_MAX = 120;

/**
 * URL slug from a title. Only ASCII letters and digits survive, so a title in
 * Urdu or made of emoji can come out empty; the API gives those a fallback
 * slug instead of saving "" or "-", which every later such post collided with.
 */
export function slugify(text: string) {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length <= SLUG_MAX) return slug;
  const cut = slug.slice(0, SLUG_MAX);
  return cut.slice(0, cut.lastIndexOf("-") > 40 ? cut.lastIndexOf("-") : SLUG_MAX);
}

/**
 * MySQL column sizes for the Blog table. Prisma's String is VARCHAR(191) and
 * @db.Text is TEXT, which holds 65,535 bytes, not characters. A strict-mode
 * server rejects anything longer, so the API checks first and says which field
 * is too long instead of failing the whole save.
 */
export const BLOG_LIMITS = {
  title: 191,
  image: 191,
  tags: 191,
  metaTitle: 120,
  metaDescription: 320,
  contentBytes: 65_535,
  excerptBytes: 65_535,
} as const;

export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t).trim()).filter(Boolean);
    }
  } catch {
    /* fall through */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function stringifyTags(tags: string[]) {
  return JSON.stringify(tags.filter(Boolean));
}

export function tagsFromInput(input: string) {
  return stringifyTags(
    input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

export function tagsToInput(raw: string) {
  return parseTags(raw).join(", ");
}

export function formatBlogDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function looksLikeHtml(content: string) {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip scripts and event handlers while keeping common article markup. */
export function sanitizeBlogHtml(html: string) {
  return html
    .replace(/<\s*(script|iframe|object|embed|form|link|meta|style)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|form|link|meta|style)[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<\s*a\b([^>]*)>/gi, (_match, attrs: string) => {
      const href = attrs.match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2] ?? "";
      const safe =
        href.startsWith("/") ||
        href.startsWith("#") ||
        /^https?:\/\//i.test(href) ||
        href.startsWith("mailto:");
      const target = /\btarget\s*=/i.test(attrs) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return safe ? `<a href="${escapeHtml(href)}"${target}>` : "<a>";
    });
}

/** Plain text becomes paragraphs; HTML is sanitized for safe rendering. */
export function blogContentToHtml(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) return sanitizeBlogHtml(trimmed);
  return trimmed
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}
