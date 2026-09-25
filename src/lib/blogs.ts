import { prisma, isDatabaseAvailable } from "@/lib/prisma";
import { fallbackBlogs, type FallbackBlog } from "@/lib/fallback-blogs";

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  tags: string;
  format: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

const publicBlogSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  image: true,
  tags: true,
  format: true,
  metaTitle: true,
  metaDescription: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const;

function fromFallback(blog: FallbackBlog): PublicBlog {
  const createdAt = new Date(blog.createdAt);
  return {
    ...blog,
    metaTitle: blog.metaTitle ?? null,
    metaDescription: blog.metaDescription ?? null,
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Every published article, or the built-in set when the database has none.
 *
 * This exists because the sitemap and the article pages were reading from two
 * different places: the sitemap is generated during the build, against
 * whichever database the build was pointed at, while the pages were marked
 * `force-dynamic` and queried at request time against the live one. The live
 * Blog table is empty, so the deployed sitemap was advertising four URLs to
 * search engines and all four returned 404. Both now read from here, and the
 * pages are prerendered from the same data the sitemap is built from, so the
 * two cannot disagree again.
 */
export async function getPublicBlogs(): Promise<PublicBlog[]> {
  if (!(await isDatabaseAvailable())) return fallbackBlogs.map(fromFallback);

  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: publicBlogSelect,
    });
    return blogs.length === 0 ? fallbackBlogs.map(fromFallback) : blogs;
  } catch (error) {
    console.error("[blogs] Database unavailable, serving fallback:", error);
    return fallbackBlogs.map(fromFallback);
  }
}

export async function getBlogBySlug(slug: string): Promise<PublicBlog | null> {
  const blogs = await getPublicBlogs();
  return blogs.find((blog) => blog.slug === slug) ?? null;
}
