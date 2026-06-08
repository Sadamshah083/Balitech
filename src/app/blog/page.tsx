import type { Metadata } from "next";
import type { Blog } from "@prisma/client";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import BlogCard from "@/components/blog/BlogCard";
import { prisma } from "@/lib/prisma";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Blog | Bali Tech Pvt. Ltd",
  description: "Insights, news, and BPO expertise from the Bali Tech team.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const blogs = await prisma.blog.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const featured = blogs.filter((b) => b.format === "featured");
  const standard = blogs.filter((b) => b.format === "standard");
  const compact = blogs.filter((b) => b.format === "compact");

  return (
    <SitePage>
      <PageBanner
        title="Our Blog"
        subtitle="Industry insights, team stories, and outsourcing expertise from Bali Tech."
        image={siteImages.office}
      />

      <section className="section-gradient py-16">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          {blogs.length === 0 ? (
            <p className="text-center text-muted">
              No blog posts published yet. Check back soon.
            </p>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="space-y-6">
                  <h2 className="brand-label">Featured</h2>
                  {featured.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} layout="featured" />
                  ))}
                </div>
              )}

              {standard.length > 0 && (
                <div>
                  <h2 className="brand-label mb-6">Articles</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {standard.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))}
                  </div>
                </div>
              )}

              {compact.length > 0 && (
                <div>
                  <h2 className="brand-label mb-6">Quick Reads</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {compact.map((blog) => (
                      <BlogCard
                        key={blog.id}
                        blog={blog}
                        layout="compact"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SitePage>
  );
}
