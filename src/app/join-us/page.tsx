import type { Metadata } from "next";
import { Briefcase, GraduationCap, TrendingUp, Users } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import CareerCTA from "@/components/landing/CareerCTA";
import ContactForm from "@/components/landing/ContactForm";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Join Us | Bali Tech Pvt. Ltd",
  description: "Build your career at Islamabad's leading call center.",
};

const benefits = [
  {
    icon: TrendingUp,
    title: "Career Growth",
    description: "Clear promotion paths and performance-based rewards.",
  },
  {
    icon: GraduationCap,
    title: "Training Programs",
    description: "Ongoing coaching to sharpen your sales and support skills.",
  },
  {
    icon: Users,
    title: "Great Culture",
    description: "A supportive team environment with regular events.",
  },
  {
    icon: Briefcase,
    title: "Stable Income",
    description: "Competitive salary packages with incentives and bonuses.",
  },
];

export default function JoinUsPage() {
  return (
    <SitePage>
      <PageBanner
        title="Join Us"
        subtitle="Start a rewarding career with Bali Tech — we're always looking for talent."
        image={siteImages.career}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">
            Why Work With Bali Tech?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="glow-border rounded-2xl bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 inline-flex rounded-full bg-orange/10 p-4 text-orange">
                  <item.icon size={28} />
                </div>
                <h3 className="mb-2 font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CareerCTA />
      <ContactForm />
    </SitePage>
  );
}
