import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { blogContentToHtml, formatBlogDate } from "@/lib/blog";
import BlogPostCategories from "@/components/blog/BlogPostCategories";
import {
  blogImageAlt,
  getActiveBlogCategories,
  getBlogBySlug,
  getPublicBlogs,
  getRecentBlogs,
} from "@/lib/blogs";
import {
  breadcrumbSchema,
  DEFAULT_OG_IMAGE,
  SITE_LEGAL_NAME,
  SITE_URL,
} from "@/lib/seo";
import { serviceHref, servicePages } from "@/lib/service-pages";
import JsonLd from "@/components/seo/JsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: "Blog | Bali Tech" };

  const url = `${SITE_URL}/blog/${blog.slug}`;
  const title = blog.metaTitle?.trim() || blog.title;
  const description =
    blog.metaDescription?.trim() || blog.excerpt?.trim() || blog.title;
  const image = blog.image ?? DEFAULT_OG_IMAGE;
  const tags = blog.tagList.map((t) => t.name);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_LEGAL_NAME,
      publishedTime: (blog.publishedAt ?? blog.createdAt).toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
      images: [{ url: image, alt: blog.title }],
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export async function generateStaticParams() {
  const blogs = await getPublicBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) notFound();

  const [recent, categories] = await Promise.all([
    getRecentBlogs(blog.id, 1),
    getActiveBlogCategories(),
  ]);

  const html = blogContentToHtml(blog.content);
  const linked = servicePages.filter((page) =>
    page.relatedBlogs.includes(blog.slug)
  );
  const relatedServices = (linked.length > 0 ? linked : servicePages).slice(0, 4);
  const description =
    blog.metaDescription?.trim() || blog.excerpt?.trim() || blog.title;
  const imageUrl = blog.image
    ? blog.image.startsWith("http")
      ? blog.image
      : `${SITE_URL}${blog.image}`
    : undefined;

  const crumbs = [
    { name: "Blogs", path: "/blog" },
    ...(blog.category
      ? [
          {
            name: blog.category.name,
            path: `/blog/category/${blog.category.slug}`,
          },
        ]
      : []),
    { name: blog.title, path: `/blog/${blog.slug}` },
  ];

  return (
    <SitePage>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: blog.metaTitle?.trim() || blog.title,
          description,
          ...(imageUrl ? { image: [imageUrl] } : {}),
          datePublished: (blog.publishedAt ?? blog.createdAt).toISOString(),
          dateModified: blog.updatedAt.toISOString(),
          keywords: blog.tagList.map((t) => t.name).join(", "),
          mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
          articleSection: blog.category?.name,
          author: {
            "@type": "Organization",
            name: SITE_LEGAL_NAME,
            url: SITE_URL,
          },
          publisher: {
            "@type": "Organization",
            name: SITE_LEGAL_NAME,
            url: SITE_URL,
            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
            },
          },
        }}
      />
      <article className="section-gradient section-with-net py-24">
        <SectionAnimatedNet />
        <div className="blog-post__container blog-post-layout">
          <div className="blog-post-layout__main">
            <Link
              href="/blog"
              className="text-sm font-bold uppercase tracking-wider text-orange hover:underline"
            >
              ← Back to Blog
            </Link>

            <p className="brand-label mt-8">
              {formatBlogDate(blog.publishedAt ?? blog.createdAt)}
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {blog.title}
            </h1>

            {(blog.category || blog.tagList.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {blog.category && (
                  <Link
                    href={`/blog/category/${blog.category.slug}`}
                    className="inline-flex rounded-full bg-orange px-3.5 py-1.5 text-xs font-bold text-[#0d1a3a] no-underline"
                  >
                    {blog.category.name}
                  </Link>
                )}
                {blog.tagList.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="inline-flex rounded-full border border-orange/40 bg-orange/15 px-3 py-1.5 text-xs font-bold text-orange no-underline"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {blog.image && (
              <div className="relative mt-8 aspect-[16/9] min-h-[18rem] overflow-hidden rounded-3xl glow-border sm:min-h-[24rem]">
                <Image
                  src={blog.image}
                  alt={blogImageAlt(blog)}
                  fill
                  priority
                  quality={90}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 52rem"
                />
              </div>
            )}

            {blog.excerpt && (
              <p className="mt-8 text-lg font-medium leading-relaxed text-foreground/90">
                {blog.excerpt}
              </p>
            )}

            <div
              className="prose-blog mt-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {recent.length > 0 && (
              <aside className="mt-14" aria-labelledby="recent-blogs">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <h2
                    id="recent-blogs"
                    className="m-0 text-xl font-extrabold tracking-tight text-foreground"
                  >
                    Recent blog
                  </h2>
                  <Link
                    href="/blog"
                    className="text-sm font-bold text-orange no-underline hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {recent.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="group grid overflow-hidden rounded-2xl border border-foreground/10 bg-card text-inherit no-underline transition hover:border-orange/50 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
                  >
                    <div className="relative aspect-[16/10] w-full bg-[#0d1a3a] sm:aspect-auto sm:min-h-[9rem]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={blogImageAlt(item)}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          quality={80}
                          sizes="(max-width: 640px) 100vw, 14rem"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-[linear-gradient(160deg,#0d1a3a,#1a2d5c)]"
                          aria-hidden
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2 p-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {formatBlogDate(item.publishedAt ?? item.createdAt)}
                      </span>
                      <span className="text-lg font-bold leading-snug text-foreground group-hover:text-orange">
                        {item.title}
                      </span>
                      {item.excerpt && (
                        <span className="line-clamp-2 text-sm leading-relaxed text-muted">
                          {item.excerpt}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </aside>
            )}

            <aside
              className="mt-14 rounded-2xl border border-foreground/10 bg-background/40 p-6"
              aria-labelledby="blog-related-services"
            >
              <h2 id="blog-related-services" className="text-lg font-bold text-foreground">
                Related BALITECH services
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {relatedServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={serviceHref(service.slug)}
                      className="font-semibold text-orange hover:underline"
                    >
                      {service.heading}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <aside className="blog-post-layout__aside" aria-label="Blog categories">
            <BlogPostCategories
              categories={categories}
              activeSlug={blog.category?.slug}
            />
          </aside>
        </div>
      </article>
    </SitePage>
  );
}
