import Link from "next/link";
import type { PublicBlogCategory, PublicBlogTag } from "@/lib/blogs";

type Props = {
  categories: PublicBlogCategory[];
  activeSlug?: string | null;
  /** Tags of the open post only. */
  tags?: PublicBlogTag[];
};

/** Category navigation card for the single-blog sidebar. */
export default function BlogPostCategories({ categories, activeSlug, tags = [] }: Props) {
  if (categories.length === 0) return null;

  return (
    <div className="blog-post-cats">
      <p className="blog-post-cats__label">Categories</p>
      <ul className="blog-post-cats__list">
        {categories.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <li key={category.id}>
              <Link
                href={`/blog/category/${category.slug}`}
                className={`blog-post-cats__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span>{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {tags.length > 0 && (
        <div className="blog-post-cats__tags">
          <p className="blog-post-cats__label">Tags</p>
          <ul className="blog-post-cats__tag-list">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link href={`/blog/tag/${tag.slug}`} className="blog-post-cats__tag">
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/blog" className="blog-post-cats__all">
        View all blogs →
      </Link>
    </div>
  );
}
