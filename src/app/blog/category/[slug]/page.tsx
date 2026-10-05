import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import BlogListing from "@/components/blog/BlogListing";
import {
  getActiveBlogCategories,
  getBlogCategoryBySlug,
  getPublicBlogs,
  resolveCategoryRedirect,
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
  const category = await getBlogCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const blogs = await getPublicBlogs({ categorySlug: slug });
  const title = category.metaTitle?.trim() || category.name;
  const description =
    category.metaDescription?.trim() ||
    category.description?.trim() ||
    `Articles in ${category.name} from BALITECH.`;
  const ogImage = category.image || undefined;

  return {
    ...pageMetadata({
      title,
      description,
      path: `/blog/category/${category.slug}`,
    }),
    robots: blogs.length === 0 ? { index: false, follow: true } : undefined,
    alternates: { canonical: `${SITE_URL}/blog/category/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/category/${category.slug}`,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: category.imageAlt?.trim() || category.name,
              },
            ],
          }
        : {}),
    },
  };
}

export async function generateStaticParams() {
  const categories = await getActiveBlogCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  let category = await getBlogCategoryBySlug(slug);

  if (!category) {
    const redirected = await resolveCategoryRedirect(slug);
    if (redirected) {
      permanentRedirect(`/blog/category/${redirected}`);
    }
    notFound();
  }

  const [blogs, categories] = await Promise.all([
    getPublicBlogs({ categorySlug: category.slug }),
    getActiveBlogCategories(),
  ]);

  const heroAlt =
    category.imageAlt?.trim() ||
    category.metaDescription?.trim() ||
    category.description?.trim() ||
    category.name;

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Blogs", path: "/blog" },
          { name: category.name, path: `/blog/category/${category.slug}` },
        ])}
      />
      <div className="blog-page section-with-net">
        <SectionAnimatedNet />
        <section className="blog-archive-hero">
          <div className="blog-page__container blog-archive-hero__grid">
            <div className="blog-archive-hero__copy">
              <p className="blog-articles__eyebrow">Category</p>
              <h1 className="blog-archive-hero__title">{category.name}</h1>
              {category.description?.trim() ? (
                <div className="blog-archive-hero__lead blog-archive-hero__lead--body">
                  {category.description
                    .trim()
                    .split(/\n\s*\n/)
                    .map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph.trim()}</p>
                    ))}
                </div>
              ) : category.metaDescription?.trim() ? (
                <p className="blog-archive-hero__lead">
                  {category.metaDescription.trim()}
                </p>
              ) : null}
              <p className="blog-archive-hero__count">
                {blogs.length} published article{blogs.length === 1 ? "" : "s"}
              </p>
              <Link href="/blog" className="blog-archive-hero__back">
                ← All blogs
              </Link>
            </div>
            <div className="blog-archive-hero__media">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={heroAlt}
                  fill
                  priority
                  quality={90}
                  className="object-cover"
                  unoptimized={
                    category.image.startsWith("/uploads/") ||
                    category.image.startsWith("/blogs/")
                  }
                  sizes="(max-width: 900px) 100vw, 42vw"
                />
              ) : (
                <div className="blog-archive-hero__fallback" aria-hidden />
              )}
            </div>
          </div>
        </section>
        <BlogListing
          blogs={blogs}
          categories={categories}
          tags={category.tags}
          initialCategory={category.slug}
          archiveMode
        />
      </div>
    </SitePage>
  );
}
