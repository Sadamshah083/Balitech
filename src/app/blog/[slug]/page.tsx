import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { blogContentToHtml, formatBlogDate, parseTags } from "@/lib/blog";
import { getBlogBySlug, getPublicBlogs } from "@/lib/blogs";
import { DEFAULT_OG_IMAGE, SITE_LEGAL_NAME, SITE_URL } from "@/lib/seo";
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
  const tags = parseTags(blog.tags);

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
      publishedTime: blog.createdAt.toISOString(),
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

/**
 * Prerendered at build time from the same data the sitemap is generated from.
 * Unlisted slugs still render on demand after admin publish.
 */
export async function generateStaticParams() {
  const blogs = await getPublicBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) notFound();

  const tags = parseTags(blog.tags);
  const html = blogContentToHtml(blog.content);
  const linked = servicePages.filter((page) => page.relatedBlogs.includes(blog.slug));
  const relatedServices = (linked.length > 0 ? linked : servicePages).slice(0, 4);
  const description =
    blog.metaDescription?.trim() || blog.excerpt?.trim() || blog.title;
  const imageUrl = blog.image
    ? blog.image.startsWith("http")
      ? blog.image
      : `${SITE_URL}${blog.image}`
    : undefined;

  return (
    <SitePage>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: blog.metaTitle?.trim() || blog.title,
          description,
          ...(imageUrl ? { image: [imageUrl] } : {}),
          datePublished: blog.createdAt.toISOString(),
          dateModified: blog.updatedAt.toISOString(),
          keywords: tags.join(", "),
          mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="text-sm font-bold uppercase tracking-wider text-orange hover:underline"
          >
            ← Back to Blog
          </Link>

          <p className="brand-label mt-8">{formatBlogDate(blog.createdAt)}</p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {blog.title}
          </h1>

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-xs font-bold uppercase text-orange"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {blog.image && (
            <div className="relative mt-8 aspect-[16/9] min-h-[18rem] overflow-hidden rounded-3xl glow-border sm:min-h-[24rem]">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                priority
                unoptimized={blog.image.startsWith("/blogs/") || blog.image.startsWith("/uploads/")}
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
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
      </article>
    </SitePage>
  );
}
