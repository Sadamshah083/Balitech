import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogListing from "@/components/blog/BlogListing";
import {
  getActiveBlogCategories,
  getBlogTagBySlug,
  getPublicBlogs,
} from "@/lib/blogs";
import { breadcrumbSchema, pageMetadata, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getBlogTagBySlug(slug);
  if (!tag) {
    return { title: "Tag not found", robots: { index: false, follow: false } };
  }

  const blogs = await getPublicBlogs({ tagSlug: slug });
  return {
    ...pageMetadata({
      title: `#${tag.name}`,
      description: `Articles tagged ${tag.name} from BALITECH.`,
      path: `/blog/tag/${tag.slug}`,
    }),
    robots: blogs.length === 0 ? { index: false, follow: true } : undefined,
    alternates: { canonical: `${SITE_URL}/blog/tag/${tag.slug}` },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getBlogTagBySlug(slug);
  if (!tag) notFound();

  const [blogs, categories] = await Promise.all([
    getPublicBlogs({ tagSlug: tag.slug }),
    getActiveBlogCategories(),
  ]);

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Blogs", path: "/blog" },
          { name: `#${tag.name}`, path: `/blog/tag/${tag.slug}` },
        ])}
      />
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <section className="blog-archive-hero blog-archive-hero--tag">
          <div className="blog-page__container">
            <p className="blog-articles__eyebrow">Tag</p>
            <h1 className="blog-archive-hero__title">#{tag.name}</h1>
            <p className="blog-archive-hero__count">
              {blogs.length} published article{blogs.length === 1 ? "" : "s"}
            </p>
            <Link href="/blog" className="blog-archive-hero__back">
              ← All blogs
            </Link>
          </div>
        </section>
        <BlogListing
          blogs={blogs}
          categories={categories}
          tags={[tag]}
          initialTag={tag.slug}
          archiveMode
        />
      </div>
    </SitePage>
  );
}
