import { prisma } from "@/lib/prisma";
import { stringifyTags } from "@/lib/blog";
import {
  isBlogStatus,
  normalizeTagName,
  tagSlugFromName,
  type BlogStatus,
} from "@/lib/blog-taxonomy";

export async function uniqueCategorySlug(base: string, excludeId?: string) {
  let slug = base || "category";
  let n = 2;
  while (true) {
    const existing = await prisma.blogCategory.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function uniqueTagSlug(base: string, excludeId?: string) {
  let slug = base || "tag";
  let n = 2;
  while (true) {
    const existing = await prisma.blogTag.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function uniqueBlogSlug(base: string, excludeId?: string) {
  let slug = base || "post";
  let n = 2;
  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

const CUID_RE = /^c[a-z0-9]{20,}$/;

/** Find-or-create tags by name; returns tag ids. */
export async function resolveTagIds(
  input: Array<string | { id?: string; name?: string }>
) {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    if (typeof item === "string" && CUID_RE.test(item)) {
      if (!seen.has(item)) {
        const exists = await prisma.blogTag.findUnique({ where: { id: item } });
        if (exists) {
          seen.add(item);
          ids.push(item);
          continue;
        }
      } else {
        continue;
      }
    }

    const name =
      typeof item === "string"
        ? normalizeTagName(item)
        : normalizeTagName(item.name ?? "");
    const explicitId = typeof item === "object" ? item.id : undefined;

    if (explicitId) {
      const exists = await prisma.blogTag.findUnique({ where: { id: explicitId } });
      if (exists && !seen.has(exists.id)) {
        seen.add(exists.id);
        ids.push(exists.id);
      }
      continue;
    }

    if (!name) continue;
    const slug = tagSlugFromName(name);
    let tag = await prisma.blogTag.findUnique({ where: { slug } });
    if (!tag) {
      tag = await prisma.blogTag.create({ data: { name, slug } });
    }
    if (!seen.has(tag.id)) {
      seen.add(tag.id);
      ids.push(tag.id);
    }
  }

  return ids;
}

export async function syncBlogTagLinks(blogId: string, tagIds: string[]) {
  await prisma.blogTagOnBlog.deleteMany({ where: { blogId } });
  if (tagIds.length) {
    await prisma.blogTagOnBlog.createMany({
      data: tagIds.map((tagId) => ({ blogId, tagId })),
      skipDuplicates: true,
    });
  }
  const tags = await prisma.blogTag.findMany({
    where: { id: { in: tagIds } },
    select: { name: true },
  });
  await prisma.blog.update({
    where: { id: blogId },
    data: { tags: stringifyTags(tags.map((t) => t.name)) },
  });
}

export async function syncCategoryTagLinks(categoryId: string, tagIds: string[]) {
  await prisma.blogCategoryTag.deleteMany({ where: { categoryId } });
  if (tagIds.length) {
    await prisma.blogCategoryTag.createMany({
      data: tagIds.map((tagId) => ({ categoryId, tagId })),
      skipDuplicates: true,
    });
  }
}

export function resolvePublishFields(input: {
  status?: unknown;
  isPublished?: unknown;
  publishedAt?: unknown;
  scheduledAt?: unknown;
}) {
  let status: BlogStatus = isBlogStatus(input.status)
    ? input.status
    : input.isPublished === false
      ? "draft"
      : "published";

  const scheduledAt =
    input.scheduledAt != null && String(input.scheduledAt).trim()
      ? new Date(String(input.scheduledAt))
      : null;

  if (status === "scheduled" && scheduledAt && scheduledAt.getTime() <= Date.now()) {
    status = "published";
  }

  const publishedAt =
    status === "published"
      ? input.publishedAt
        ? new Date(String(input.publishedAt))
        : new Date()
      : null;

  return {
    status,
    isPublished: status === "published",
    publishedAt,
    scheduledAt: status === "scheduled" ? scheduledAt : null,
  };
}
