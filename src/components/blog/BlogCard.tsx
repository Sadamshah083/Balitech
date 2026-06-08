import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, parseTags, type BlogFormat } from "@/lib/blog";

export type BlogCardData = {
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  tags: string;
  format: string;
  createdAt: string | Date;
};

type BlogCardProps = {
  blog: BlogCardData;
  layout?: BlogFormat;
};

export default function BlogCard({ blog, layout }: BlogCardProps) {
  const format = (layout ?? blog.format) as BlogFormat;
  const tags = parseTags(blog.tags);
  const date = formatBlogDate(blog.createdAt);

  if (format === "featured") {
    return (
      <Link
        href={`/blog/${blog.slug}`}
        className="blog-card-featured glow-border group grid overflow-hidden rounded-3xl bg-card md:grid-cols-2"
      >
        <div className="relative min-h-[220px] md:min-h-[320px]">
          {blog.image ? (
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface text-muted">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-8">
          <p className="brand-label mb-2">Featured</p>
          <h3 className="text-2xl font-bold text-foreground group-hover:text-orange">
            {blog.title}
          </h3>
          <p className="mt-3 text-sm text-muted">{date}</p>
          {blog.excerpt && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {blog.excerpt}
            </p>
          )}
          <BlogTags tags={tags} className="mt-5" />
        </div>
      </Link>
    );
  }

  if (format === "compact") {
    return (
      <Link
        href={`/blog/${blog.slug}`}
        className="blog-card-compact glow-border group flex items-center gap-4 rounded-2xl bg-card p-4 transition hover:border-orange"
      >
        {blog.image && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-foreground group-hover:text-orange">
            {blog.title}
          </h3>
          <p className="text-xs text-muted">{date}</p>
        </div>
        <BlogTags tags={tags.slice(0, 2)} />
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="blog-card-standard glow-border group flex h-full flex-col overflow-hidden rounded-2xl bg-card transition hover:border-orange"
    >
      {blog.image && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs text-muted">{date}</p>
        <h3 className="mt-2 text-lg font-bold text-foreground group-hover:text-orange">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">
            {blog.excerpt}
          </p>
        )}
        <BlogTags tags={tags} className="mt-4" />
      </div>
    </Link>
  );
}

function BlogTags({
  tags,
  className = "",
}: {
  tags: string[];
  className?: string;
}) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-orange/35 bg-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
