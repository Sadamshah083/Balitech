import type { MetadataRoute } from "next";
import {
  getActiveBlogCategories,
  getPublicBlogs,
} from "@/lib/blogs";
import { SITE_URL as BASE_URL } from "@/lib/seo";
import { serviceHref, servicePages } from "@/lib/service-pages";

/* Hourly rebuild as a safety net; publishing a blog also calls
   refreshPublicPages() which revalidates /sitemap.xml immediately. */
export const revalidate = 3600;

const staticRoutes = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/services", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/our-team", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/gallery", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/ceo-words", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/our-offices", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/career", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/join-us", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/privacy-policy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/recruitment-privacy-notice", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const serviceEntries: MetadataRoute.Sitemap = servicePages.map((page) => ({
    url: `${BASE_URL}${serviceHref(page.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const [blogs, categories] = await Promise.all([
    getPublicBlogs(),
    getActiveBlogCategories(),
  ]);

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((category) => category.postCount > 0)
    .map((category) => ({
      url: `${BASE_URL}/blog/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));

  const tagSlugs = new Set<string>();
  for (const blog of blogs) {
    for (const tag of blog.tagList) tagSlugs.add(tag.slug);
  }
  const tagEntries: MetadataRoute.Sitemap = [...tagSlugs].map((slug) => ({
    url: `${BASE_URL}/blog/tag/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [
    ...staticEntries,
    ...serviceEntries,
    ...blogEntries,
    ...categoryEntries,
    ...tagEntries,
  ];
}
