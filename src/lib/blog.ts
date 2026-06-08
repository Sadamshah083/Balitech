export type BlogFormat = "standard" | "featured" | "compact";

export const blogFormatOptions: { value: BlogFormat; label: string }[] = [
  { value: "standard", label: "Standard Card" },
  { value: "featured", label: "Featured (Large)" },
  { value: "compact", label: "Compact List" },
];

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

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
