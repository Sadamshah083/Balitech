import type { Metadata } from "next";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import MediaSection from "@/components/landing/MediaSection";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Press Release | Bali Tech Pvt. Ltd",
  description: "Latest news, announcements, and media from Bali Tech.",
};

const pressReleases = [
  {
    date: "March 15, 2025",
    title: "Bali Tech Expands Operations With 50 New Hires",
    excerpt:
      "Bali Tech Pvt. Ltd announces a major expansion, adding 50 skilled agents to support growing client demand across US campaigns.",
  },
  {
    date: "February 8, 2025",
    title: "Record-Breaking Q4 Performance Achieved",
    excerpt:
      "Our team surpassed all quarterly targets, achieving 99% client satisfaction and handling over 2 million calls.",
  },
  {
    date: "January 20, 2025",
    title: "Annual Employee Excellence Awards Ceremony",
    excerpt:
      "Bali Tech honored top performers at its annual awards dinner, recognizing outstanding dedication and results.",
  },
  {
    date: "December 5, 2024",
    title: "New Strategic Partnership Announced",
    excerpt:
      "Bali Tech partners with leading CRM providers to enhance campaign delivery and reporting capabilities.",
  },
];

export default function PressReleasePage() {
  return (
    <SitePage>
      <PageBanner
        title="Press Release"
        subtitle="Stay updated with the latest news and announcements from Bali Tech."
        image={siteImages.media[0]}
      />
      <section className="py-16">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          {pressReleases.map((item) => (
            <article
              key={item.title}
              className="glow-border rounded-2xl bg-card p-6 md:p-8"
            >
              <p className="mb-2 text-sm font-semibold text-orange">
                {item.date}
              </p>
              <h2 className="mb-3 text-xl font-bold text-foreground md:text-2xl">
                {item.title}
              </h2>
              <p className="leading-relaxed text-muted">{item.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
      <MediaSection />
    </SitePage>
  );
}
