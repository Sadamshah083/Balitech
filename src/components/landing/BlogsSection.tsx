"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import BlogCard, { type BlogCardData } from "@/components/blog/BlogCard";
import { gsap, registerGsap } from "@/lib/gsap-register";

export default function BlogsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [blogs, setBlogs] = useState<BlogCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blogs?public=true&limit=3")
      .then((res) => res.json())
      .then((data) => setBlogs(data.blogs ?? []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  useGSAP(
    () => {
      if (!blogs.length) return;
      registerGsap();
      gsap.from(".blog-reveal-item", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: sectionRef, dependencies: [blogs.length] }
  );

  const featured = blogs.find((b) => b.format === "featured") ?? blogs[0];
  const others = blogs.filter((b) => b.slug !== featured?.slug).slice(0, 2);

  return (
    <section ref={sectionRef} id="blog" className="section-gradient py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="brand-label mb-4">Insights</p>
            <AnimatedTitle containerClass="!text-left sm:max-w-xl">
              Latest From Our Blog
            </AnimatedTitle>
          </div>
          <Link
            href="/blog"
            className="shrink-0 rounded-full border border-orange px-6 py-2 text-sm font-semibold uppercase tracking-wider text-orange transition hover:bg-orange hover:text-on-primary"
          >
            View All Blogs
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6">
            <div className="h-64 animate-pulse rounded-3xl bg-card" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-48 animate-pulse rounded-2xl bg-card" />
              <div className="h-48 animate-pulse rounded-2xl bg-card" />
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-center text-muted">
            Blog posts will appear here once added from the admin panel.
          </p>
        ) : (
          <div className="space-y-6">
            {featured && (
              <div className="blog-reveal-item">
                <BlogCard blog={featured} layout="featured" />
              </div>
            )}
            {others.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {others.map((blog) => (
                  <div key={blog.slug} className="blog-reveal-item">
                    <BlogCard blog={blog} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
