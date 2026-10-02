import { prisma, isDatabaseAvailable } from "@/lib/prisma";
import { fallbackBlogs, type FallbackBlog } from "@/lib/fallback-blogs";
import { parseTags } from "@/lib/blog";
import { publicBlogWhere } from "@/lib/blog-taxonomy";

export type PublicBlogTag = { id: string; name: string; slug: string };

export type PublicBlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  order: number;
  tags: PublicBlogTag[];
  postCount: number;
};

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  imageAlt: string | null;
  tags: string;
  tagList: PublicBlogTag[];
  format: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
  status: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: PublicBlogCategory | null;
};

/** Accessible alt text for a blog cover (falls back to title). */
export function blogImageAlt(blog: {
  title: string;
  imageAlt?: string | null;
  metaDescription?: string | null;
  excerpt?: string | null;
}) {
  return (
    blog.imageAlt?.trim() ||
    blog.metaDescription?.trim() ||
    blog.excerpt?.trim() ||
    blog.title
  );
}

const blogInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      imageAlt: true,
      metaTitle: true,
      metaDescription: true,
      isActive: true,
      order: true,
    },
  },
  tagLinks: {
    include: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

function mapBlog(blog: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  imageAlt?: string | null;
  tags: string;
  format: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
  status?: string | null;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    imageAlt: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    isActive: boolean;
    order: number;
  } | null;
  tagLinks?: { tag: PublicBlogTag }[];
}): PublicBlog {
  const tagList =
    blog.tagLinks?.map((link) => link.tag) ??
    parseTags(blog.tags).map((name) => ({
      id: name,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));

  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    image: blog.image,
    imageAlt: blog.imageAlt ?? null,
    tags: blog.tags,
    tagList,
    format: blog.format,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    order: blog.order,
    status: blog.status ?? "published",
    publishedAt: blog.publishedAt ?? blog.createdAt,
    scheduledAt: blog.scheduledAt ?? null,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    category: blog.category
      ? {
          ...blog.category,
          metaTitle: blog.category.metaTitle ?? null,
          metaDescription: blog.category.metaDescription ?? null,
          tags: [],
          postCount: 0,
        }
      : null,
  };
}

function fromFallback(blog: FallbackBlog): PublicBlog {
  const createdAt = new Date(blog.createdAt);
  return mapBlog({
    ...blog,
    metaTitle: blog.metaTitle ?? null,
    metaDescription: blog.metaDescription ?? null,
    createdAt,
    updatedAt: createdAt,
    status: "published",
    publishedAt: createdAt,
    scheduledAt: null,
    category: null,
    tagLinks: [],
  });
}

export async function getPublicBlogs(options?: {
  categorySlug?: string;
  tagSlug?: string;
  q?: string;
}): Promise<PublicBlog[]> {
  if (!(await isDatabaseAvailable())) return fallbackBlogs.map(fromFallback);

  try {
    const now = new Date();
    const q = options?.q?.trim().toLowerCase();

    const blogs = await prisma.blog.findMany({
      where: {
        AND: [
          publicBlogWhere(now),
          options?.categorySlug
            ? { category: { slug: options.categorySlug, isActive: true } }
            : {},
          options?.tagSlug
            ? { tagLinks: { some: { tag: { slug: options.tagSlug } } } }
            : {},
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { order: "asc" }],
      include: blogInclude,
    });

    let mapped = blogs.map(mapBlog);
    if (q) {
      mapped = mapped.filter((blog) => {
        const hay = [
          blog.title,
          blog.excerpt ?? "",
          blog.category?.name ?? "",
          ...blog.tagList.map((t) => t.name),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return mapped.length === 0 && !options?.categorySlug && !options?.tagSlug && !q
      ? fallbackBlogs.map(fromFallback)
      : mapped;
  } catch (error) {
    console.error("[blogs] Database unavailable, serving fallback:", error);
    return fallbackBlogs.map(fromFallback);
  }
}

export async function getBlogBySlug(slug: string): Promise<PublicBlog | null> {
  if (!(await isDatabaseAvailable())) {
    return fallbackBlogs.map(fromFallback).find((b) => b.slug === slug) ?? null;
  }

  try {
    const now = new Date();
    const blog = await prisma.blog.findFirst({
      where: { slug, AND: [publicBlogWhere(now)] },
      include: blogInclude,
    });
    if (blog) return mapBlog(blog);

    const fallback = fallbackBlogs.map(fromFallback).find((b) => b.slug === slug);
    return fallback ?? null;
  } catch {
    return fallbackBlogs.map(fromFallback).find((b) => b.slug === slug) ?? null;
  }
}

export async function getActiveBlogCategories(): Promise<PublicBlogCategory[]> {
  if (!(await isDatabaseAvailable())) return [];

  try {
    const now = new Date();
    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        tagLinks: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: {
          select: {
            blogs: {
              where: publicBlogWhere(now),
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      imageAlt: category.imageAlt,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      isActive: category.isActive,
      order: category.order,
      tags: category.tagLinks.map((link) => link.tag),
      postCount: category._count.blogs,
    }));
  } catch (error) {
    console.error("[blog-categories]", error);
    return [];
  }
}

export async function getBlogCategoryBySlug(
  slug: string
): Promise<PublicBlogCategory | null> {
  const categories = await getActiveBlogCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function resolveCategoryRedirect(oldSlug: string) {
  if (!(await isDatabaseAvailable())) return null;
  try {
    const row = await prisma.blogCategoryRedirect.findUnique({
      where: { oldSlug },
      include: { category: { select: { slug: true, isActive: true } } },
    });
    if (!row?.category?.isActive) return null;
    return row.category.slug;
  } catch {
    return null;
  }
}

export async function getBlogTagBySlug(slug: string): Promise<PublicBlogTag | null> {
  if (!(await isDatabaseAvailable())) return null;
  try {
    return await prisma.blogTag.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  } catch {
    return null;
  }
}

export async function getRelatedBlogs(
  blog: PublicBlog,
  limit = 3
): Promise<PublicBlog[]> {
  const all = await getPublicBlogs();
  const scored = all
    .filter((item) => item.id !== blog.id)
    .map((item) => {
      let score = 0;
      if (blog.category && item.category?.id === blog.category.id) score += 3;
      const shared = item.tagList.filter((tag) =>
        blog.tagList.some((mine) => mine.slug === tag.slug)
      ).length;
      score += shared;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || +b.item.createdAt - +a.item.createdAt)
    .slice(0, limit)
    .map((row) => row.item);

  if (scored.length >= limit) return scored;

  const extras = all
    .filter(
      (item) =>
        item.id !== blog.id && !scored.some((picked) => picked.id === item.id)
    )
    .slice(0, limit - scored.length);

  return [...scored, ...extras];
}

export async function getRecentBlogs(
  excludeId: string,
  limit = 4
): Promise<PublicBlog[]> {
  const all = await getPublicBlogs();
  return all.filter((item) => item.id !== excludeId).slice(0, limit);
}
