import type { Metadata } from "next";
import { Briefcase, GraduationCap, TrendingUp, Users } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import CareerCTA from "@/components/landing/CareerCTA";
import ContactForm from "@/components/landing/ContactForm";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Join Us | BALITECH",
  description:
    "Build your career at BALITECH — competitive salary based on experience and interview performance.",
};

const { career } = companyContent;

const benefits = [
  {
    icon: TrendingUp,
    title: "Career Growth",
    description:
      "Create leadership and career growth opportunities across nationwide campaigns.",
  },
  {
    icon: GraduationCap,
    title: "Training Programs",
    description:
      "Develop skilled and high-performing professionals through ongoing coaching.",
  },
  {
    icon: Users,
    title: "Professional Culture",
    description:
      "Build a strong and professional workplace culture with team recognition.",
  },
  {
    icon: Briefcase,
    title: "Competitive Salary",
    description: career.salary,
  },
];

export default function JoinUsPage() {
  return (
    <SitePage>
      <PageBanner
        title="Join Us"
        subtitle="Start a rewarding career with BALITECH — we're always looking for talent."
        image={siteImages.career}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">
            Why Work With BALITECH?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted">
            {career.description}
          </p>
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
