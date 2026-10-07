"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { HeadingBrush } from "@/components/brand/HeadingLastWord";
import DeferredBusinessInquiryForm from "@/components/home/DeferredBusinessInquiryForm";
import { formatBlogDate } from "@/lib/blog";
import {
  blogImageAlt,
  type PublicBlog,
  type PublicBlogCategory,
  type PublicBlogTag,
} from "@/lib/blogs";
import { useLazyGsap } from "@/lib/use-lazy-gsap";

/** Matches CSS `top: 6.25rem` — keep filter below the fixed navbar. */
const FILTER_STICKY_TOP = 100;

type Props = {
  blogs: PublicBlog[];
  categories: PublicBlogCategory[];
  tags: PublicBlogTag[];
  initialQuery?: string;
  initialCategory?: string;
  initialTag?: string;
  /** Homepage-style hero + filters side by side. Off on category/tag archives. */
  showHero?: boolean;
  /** Category/tag archives: skip the duplicate Insights header under the archive hero. */
  archiveMode?: boolean;
};

const PAGE_SIZE = 9;

export default function BlogListing({
  blogs,
  categories,
  tags: _unusedTags,
  initialQuery = "",
  initialCategory = "",
  initialTag = "",
  showHero = false,
  archiveMode = false,
}: Props) {
  void _unusedTags;
  const heroRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const asideTrackRef = useRef<HTMLElement>(null);
  const stickyCardRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [tagSlug, setTagSlug] = useState(initialTag);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  /*
   * Pin the square filter card while the blog column scrolls, then release
   * at the footer. Uses fixed/absolute because CSS sticky is unreliable here.
   */
  useEffect(() => {
    const shell = shellRef.current;
    const track = asideTrackRef.current;
    const card = stickyCardRef.current;
    if (!shell || !track || !card) return;

    const main = shell.querySelector(".blog-index-shell__main") as HTMLElement | null;
    let frame = 0;
    let placeholder: HTMLDivElement | null = null;

    const ensurePlaceholder = (height: number, width: number) => {
      if (!placeholder) {
        placeholder = document.createElement("div");
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.className = "blog-index-shell__aside-ph";
        track.insertBefore(placeholder, card);
      }
      placeholder.style.height = `${height}px`;
      placeholder.style.width = `${width}px`;
      placeholder.style.flexShrink = "0";
    };

    const removePlaceholder = () => {
      placeholder?.remove();
      placeholder = null;
    };

    const clearInline = () => {
      card.classList.remove("is-fixed", "is-pinned-end");
      card.style.position = "";
      card.style.top = "";
      card.style.bottom = "";
      card.style.left = "";
      card.style.right = "";
      card.style.width = "";
      card.style.height = "";
      card.style.zIndex = "";
      track.style.minHeight = "";
      removePlaceholder();
    };

    const update = () => {
      frame = 0;
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        clearInline();
        return;
      }

      const mainHeight = main?.offsetHeight ?? 0;
      const cardWidth = track.offsetWidth || card.offsetWidth;
      // Measure natural height (don't force a square)
      card.style.height = "auto";
      const cardHeight = card.offsetHeight;
      track.style.minHeight = `${Math.max(mainHeight, cardHeight)}px`;

      const trackRect = track.getBoundingClientRect();
      const stickStart = trackRect.top;
      const stickEnd = trackRect.bottom - cardHeight;

      if (stickStart >= FILTER_STICKY_TOP) {
        card.classList.remove("is-fixed", "is-pinned-end");
        card.style.position = "relative";
        card.style.top = "0px";
        card.style.bottom = "auto";
        card.style.left = "auto";
        card.style.width = `${cardWidth}px`;
        card.style.height = "auto";
        card.style.zIndex = "5";
        removePlaceholder();
        return;
      }

      if (stickEnd <= FILTER_STICKY_TOP) {
        card.classList.add("is-pinned-end");
        card.classList.remove("is-fixed");
        card.style.position = "absolute";
        card.style.top = "auto";
        card.style.bottom = "0px";
        card.style.left = "0px";
        card.style.width = `${cardWidth}px`;
        card.style.height = "auto";
        card.style.zIndex = "5";
        removePlaceholder();
        return;
      }

      ensurePlaceholder(cardHeight, cardWidth);
      card.classList.add("is-fixed");
      card.classList.remove("is-pinned-end");
      card.style.position = "fixed";
      card.style.top = `${FILTER_STICKY_TOP}px`;
      card.style.bottom = "auto";
      card.style.left = `${trackRect.left}px`;
      card.style.width = `${cardWidth}px`;
      card.style.height = "auto";
      card.style.zIndex = "40";
    };

    const onScrollOrResize = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onScrollOrResize) : null;
    if (main) ro?.observe(main);
    ro?.observe(shell);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
      ro?.disconnect();
      clearInline();
    };
  }, [page, categorySlug, tagSlug, blogs.length]);

  useLazyGsap(
    ({ gsap }) => {
      if (!showHero) return;
      gsap.from(".insights-hero__glow", {
        scale: 0.7,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power2.out",
      });
      gsap.from(".blog-index-hero__left > *", {
        y: 36,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.1,
      });
      // Opacity only — transforms break position:fixed sticky pinning
      gsap.from(".blog-filter-card", {
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.25,
      });
    },
    heroRef
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs.filter((blog) => {
      if (categorySlug && blog.category?.slug !== categorySlug) return false;
      if (tagSlug && !blog.tagList.some((t) => t.slug === tagSlug)) return false;
      if (!q) return true;
      const hay = [
        blog.title,
        blog.excerpt ?? "",
        blog.category?.name ?? "",
        ...blog.tagList.map((t) => t.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [blogs, query, categorySlug, tagSlug]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(query.trim() || categorySlug || tagSlug);

  function resetFilters() {
    startTransition(() => {
      setQuery("");
      setCategorySlug("");
      setTagSlug("");
      setPage(1);
    });
  }

  function scrollToResults() {
    const el = postsRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - FILTER_STICKY_TOP - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function applyCategory(slug: string) {
    startTransition(() => {
      setCategorySlug((current) => (current === slug ? "" : slug));
      setPage(1);
    });
    scrollToResults();
  }

  const filterBox = (
    <div className="blog-filter-stack">
      {/* Inquiry card above categories — same home form → POST /api/leads. */}
      <div className="blog-filter-card blog-filter-card--inquiry">
        <p className="blog-filter-card__label">Inquiry</p>
        <DeferredBusinessInquiryForm variant="job" />
      </div>

      <div className="blog-filter-card blog-filter-card--categories">
        <form
          className="blog-filter-card__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <label className="sr-only" htmlFor="blog-search">
            Search blog
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="blog-search"
              className="blog-filter-card__input"
              placeholder="Search…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              className="blog-filter-card__reset"
              onClick={resetFilters}
              aria-label="Reset filters"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </form>

        {categories.length > 0 && (
          <div className="blog-filter-card__group">
            <p className="blog-filter-card__label">Categories</p>
            <div className="blog-filter-card__chips" role="group" aria-label="Categories">
              {categories.map((category) => {
                const active = categorySlug === category.slug;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyCategory(category.slug)}
                    className={`blog-filter-card__chip${active ? " is-active" : ""}`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const results = (
    <>
      <div
        className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}
        aria-live="polite"
      >
        {pageItems.length === 0 ? (
          <p className="blog-articles__empty">
            No published articles match these filters. Try resetting or choosing another category.
          </p>
        ) : (
          <ul className="blog-articles__grid blog-articles__grid--listing">
            {pageItems.map((blog) => (
              <li key={blog.id}>
                <article className="blog-articles__item flex h-full flex-col">
                  <Link href={`/blog/${blog.slug}`} className="text-inherit no-underline">
                    {blog.image ? (
                      <div className="blog-articles__item-media">
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
                      <div
                        className="blog-articles__item-media blog-articles__item-media--empty"
                        aria-hidden
                      />
                    )}
                    <div className="blog-articles__item-body">
                      <p className="blog-articles__date">
                        {formatBlogDate(blog.publishedAt ?? blog.createdAt)}
                      </p>
                      <h3 className="blog-articles__item-title">{blog.title}</h3>
                      {blog.excerpt && (
                        <p className="blog-articles__excerpt blog-articles__excerpt--sm">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                  {blog.category && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      <Link
                        href={`/blog/category/${blog.category.slug}`}
                        className="inline-flex rounded-full bg-[#0d1a3a] px-2.5 py-1 text-xs font-bold text-white no-underline ring-1 ring-white/10"
                      >
                        {blog.category.name}
                      </Link>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-4 text-sm font-semibold"
          aria-label="Blog pagination"
        >
          <button
            type="button"
            className="rounded-full border border-foreground/15 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => { setPage((p) => p - 1); scrollToResults(); }}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-full border border-foreground/15 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => { setPage((p) => p + 1); scrollToResults(); }}
          >
            Next
          </button>
        </nav>
      )}
    </>
  );

  return (
    <section
      ref={showHero ? heroRef : undefined}
      className={`blog-listing blog-listing--sticky-filters relative z-[1]${showHero ? " insights-hero" : ""}${archiveMode ? " blog-listing--archive" : ""}`}
      aria-labelledby={
        showHero ? "insights-hero-title" : archiveMode ? undefined : "blog-listing-heading"
      }
    >
      {showHero && (
        <>
          <div className="insights-hero__glow insights-hero__glow--left" aria-hidden />
          <div className="insights-hero__glow insights-hero__glow--right" aria-hidden />
        </>
      )}

      <div ref={shellRef} className="blog-index-shell">
        <div className="blog-index-shell__main">
          <div className="blog-index-shell__content">
            {showHero ? (
              <div className="blog-index-hero__left mb-8 lg:mb-10">
                <p className="insights-hero__eyebrow brand-label">BALITECH Blogs</p>
                <h1 id="insights-hero-title" className="insights-hero__title">
                  <span className="insights-hero__title-line">Stories From</span>{" "}
                  <span className="insights-hero__title-line">
                    Our{" "}
                    <span className="insights-hero__title-highlight heading-last-word">
                      Floor
                      <HeadingBrush />
                    </span>
                  </span>
                </h1>
                <p className="insights-hero__subtitle">
                  Operations, culture, and growth notes from the teams building BALITECH every day.
                </p>

                <div className="blog-index-hero__secondary">
                  <p className="blog-articles__eyebrow">From the team</p>
                  <h2 id="blog-listing-heading" className="blog-articles__title">
                    Insights &amp; articles
                  </h2>
                  <p className="blog-articles__lead">
                    Search and filter by category. New posts appear here as soon as they are
                    published.
                  </p>
                </div>
              </div>
            ) : archiveMode ? null : (
              <div className="mb-8">
                <header>
                  <p className="blog-articles__eyebrow">From the team</p>
                  <h2 id="blog-listing-heading" className="blog-articles__title">
                    Insights &amp; articles
                  </h2>
                  <p className="blog-articles__lead">
                    Search and filter by category. New posts appear here as soon as they are
                    published.
                  </p>
                </header>
              </div>
            )}

            <div ref={postsRef} className="blog-index-posts__list">{results}</div>
          </div>
        </div>

        <aside ref={asideTrackRef} className="blog-index-shell__aside" aria-label="Blog filters">
          <div ref={stickyCardRef} className="blog-index-shell__aside-sticky blog-filter-card-wrap">
            {filterBox}
          </div>
        </aside>
      </div>
    </section>
  );
}
