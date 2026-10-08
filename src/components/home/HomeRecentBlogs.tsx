import Image from "next/image";
import { ArrowRight } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { formatBlogDate } from "@/lib/blog";
import { blogImageAlt, getPublicBlogs } from "@/lib/blogs";

const HOME_BLOG_LIMIT = 3;

/**
 * Latest published blogs as cards near the bottom of the home page.
 */
export default async function HomeRecentBlogs() {
  const blogs = (await getPublicBlogs()).slice(0, HOME_BLOG_LIMIT);
  if (blogs.length === 0) return null;

  return (
    <section
      id="recent-blogs"
      className="home-blogs"
      aria-labelledby="home-blogs-title"
    >
      <div className="home-blogs__aura" aria-hidden />

      <div className="ent-shell">
        <div className="home-blogs__head">
          <div>
            <p className="ent-eyebrow">From the team</p>
            <h2 id="home-blogs-title" className="ent-title">
              Recent <em>blogs</em>
            </h2>
            <p className="ent-lede">
              Operations, culture, and growth notes from BALITECH.
            </p>
          </div>

          <IntentLink href="/blog" className="ent-btn ent-btn--ghost">
            All blogs
            <ArrowRight size={16} aria-hidden />
          </IntentLink>
        </div>

        <ul className="home-blogs__grid">
          {blogs.map((blog) => (
            <li key={blog.id}>
              <IntentLink href={`/blog/${blog.slug}`} className="home-blogs__card">
                {blog.image ? (
                  <div className="home-blogs__media">
                    <Image
                      src={blog.image}
                      alt={blogImageAlt(blog)}
                      fill
                      quality={80}
                      className="object-cover"
                      sizes="(max-width: 720px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="home-blogs__media home-blogs__media--empty" aria-hidden />
                )}
                <div className="home-blogs__body">
                  <p className="home-blogs__date">{formatBlogDate(blog.createdAt)}</p>
                  {blog.category?.name && (
                    <p className="home-blogs__category">{blog.category.name}</p>
                  )}
                  <h3 className="home-blogs__card-title">{blog.title}</h3>
                  {blog.excerpt && <p className="home-blogs__excerpt">{blog.excerpt}</p>}
                  <span className="home-blogs__read">
                    Read article
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </div>
              </IntentLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
