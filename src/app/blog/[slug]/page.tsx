import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePage from "@/components/layout/SitePage";
import { formatBlogDate, parseTags } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blog.findUnique({ where: { slug } });
  if (!blog) return { title: "Blog | Bali Tech" };

  return {
    title: `${blog.title} | Bali Tech Blog`,
    description: blog.excerpt ?? blog.title,
  };
}

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await prisma.blog.findUnique({
    where: { slug, isPublished: true },
  });

  if (!blog) notFound();

  const tags = parseTags(blog.tags);
  const paragraphs = blog.content.split(/\n\n+/).filter(Boolean);

  return (
    <SitePage>
      <article className="section-gradient py-24">
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
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl glow-border">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                priority
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

          <div className="prose-blog mt-8 space-y-5">
            {paragraphs.map((paragraph: string) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-base leading-relaxed text-muted sm:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </SitePage>
  );
}
