import Link from "next/link";
import type { PublicBlogCategory } from "@/lib/blogs";

type Props = {
  categories: PublicBlogCategory[];
  activeSlug?: string | null;
};

/** Category navigation card for the single-blog sidebar. */
export default function BlogPostCategories({ categories, activeSlug }: Props) {
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
      <Link href="/blog" className="blog-post-cats__all">
        View all blogs →
      </Link>
    </div>
  );
}
