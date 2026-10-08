import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogListing from "@/components/blog/BlogListing";
import {
  getActiveBlogCategories,
  getPublicBlogs,
} from "@/lib/blogs";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "Blogs",
  description:
    "Operations, culture, and growth articles from BALITECH — BPO delivery, team excellence, and life across our offices.",
  path: "/blog",
});

/* Backup for admin publish → refreshPublicPages(); listing never stays stale long. */
export const revalidate = 60;

export default async function BlogPage() {
  const [blogs, categories] = await Promise.all([
    getPublicBlogs(),
    getActiveBlogCategories(),
  ]);

  const tagMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const blog of blogs) {
    for (const tag of blog.tagList) {
      tagMap.set(tag.slug, tag);
    }
  }
  for (const category of categories) {
    for (const tag of category.tags) {
      tagMap.set(tag.slug, tag);
    }
  }

  return (
    <SitePage>
      <JsonLd data={breadcrumbSchema([{ name: "Blogs", path: "/blog" }])} />
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <BlogListing
          showHero
          blogs={blogs}
          categories={categories}
          tags={[...tagMap.values()].sort((a, b) => a.name.localeCompare(b.name))}
        />
      </div>
    </SitePage>
  );
}
