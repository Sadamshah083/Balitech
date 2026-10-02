import Image from "next/image";
import Link from "next/link";
import { formatBlogDate } from "@/lib/blog";
import { blogImageAlt, type PublicBlog } from "@/lib/blogs";

type Props = {
  blogs: PublicBlog[];
};

export default function BlogArticles({ blogs }: Props) {
  if (blogs.length === 0) {
    return (
      <section className="blog-articles">
        <div className="blog-page__container">
          <p className="blog-articles__empty">New articles are on the way. Check back soon.</p>
        </div>
      </section>
    );
  }

  const featured = blogs[0];
  const rest = blogs.slice(1);

  return (
    <section className="blog-articles" aria-labelledby="blog-articles-heading">
      <div className="blog-page__container">
        <header className="blog-articles__header">
          <p className="blog-articles__eyebrow">From the team</p>
          <h2 id="blog-articles-heading" className="blog-articles__title">
            Latest articles
          </h2>
          <p className="blog-articles__lead">
            Operations, culture, and growth notes from BALITECH.
          </p>
        </header>

        <Link href={`/blog/${featured.slug}`} className="blog-articles__featured">
          {featured.image ? (
            <div className="blog-articles__featured-media">
              <Image
                src={featured.image}
                alt={blogImageAlt(featured)}
                fill
                priority
                unoptimized={featured.image.startsWith("/blogs/") || featured.image.startsWith("/uploads/")}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 76rem"
              />
            </div>
          ) : (
            <div className="blog-articles__featured-media blog-articles__featured-media--empty" aria-hidden />
          )}
          <div className="blog-articles__featured-body">
            <p className="blog-articles__date">{formatBlogDate(featured.createdAt)}</p>
            <h3 className="blog-articles__featured-title">{featured.title}</h3>
            {featured.excerpt && <p className="blog-articles__excerpt">{featured.excerpt}</p>}
            <span className="blog-articles__read">Read article</span>
          </div>
        </Link>

        {rest.length > 0 && (
          <ul className="blog-articles__grid">
            {rest.map((blog) => {
              return (
                <li key={blog.id}>
                  <Link href={`/blog/${blog.slug}`} className="blog-articles__item">
                    {blog.image ? (
                      <div className="blog-articles__item-media">
                        <Image
                          src={blog.image}
                          alt={blogImageAlt(blog)}
                          fill
                          unoptimized={blog.image.startsWith("/blogs/") || blog.image.startsWith("/uploads/")}
                          className="object-cover"
                          sizes="(max-width: 720px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="blog-articles__item-media blog-articles__item-media--empty" aria-hidden />
                    )}
                    <div className="blog-articles__item-body">
                      <p className="blog-articles__date">{formatBlogDate(blog.createdAt)}</p>
                      <h3 className="blog-articles__item-title">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="blog-articles__excerpt blog-articles__excerpt--sm">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
