import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import ContactForm from "@/components/landing/ContactForm";
import { getPublicOffices } from "@/lib/offices";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Our Offices | Bali Tech Pvt. Ltd",
  description:
    "Visit or contact Bali Tech offices in Rawalpindi, Islamabad, and across Pakistan.",
};

export default async function OurOfficesPage() {
  const offices = await getPublicOffices();
  const bannerImage = offices[0]?.image ?? siteImages.office;

  return (
    <SitePage>
      <PageBanner
        title="Our Offices"
        subtitle="Connect with Bali Tech at our locations across Pakistan."
        image={bannerImage}
      />
      <section className="section-with-net py-16">
        <SectionAnimatedNet />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {offices.map((office) => (
            <div
              key={office.id}
              className="glow-border overflow-hidden rounded-2xl bg-card"
            >
              {office.image && (
                <img
                  src={office.image}
                  alt={`${office.name} office`}
                  className="h-52 w-full object-cover"
                />
              )}
              <div className="p-6 md:p-8">
                <h2 className="mb-1 text-2xl font-bold text-foreground">
                  {office.name}
                </h2>
                <p className="mb-6 text-sm text-orange">
                  {[office.city, office.country].filter(Boolean).join(", ")}
                </p>
                <ul className="space-y-4 text-sm text-muted">
                  <li className="flex items-start gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-orange" />
                    {office.address}
                  </li>
                  {office.phone && (
                    <li className="flex items-center gap-3">
                      <Phone size={18} className="shrink-0 text-orange" />
                      <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="hover:text-orange">
                        {office.phone}
                      </a>
                    </li>
                  )}
                  {office.email && (
                    <li className="flex items-center gap-3">
                      <Mail size={18} className="shrink-0 text-orange" />
                      <a href={`mailto:${office.email}`} className="hover:text-orange">
                        {office.email}
                      </a>
                    </li>
                  )}
                  {office.hours && (
                    <li className="flex items-center gap-3">
                      <Clock size={18} className="shrink-0 text-orange" />
                      {office.hours}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ContactForm />
    </SitePage>
  );
}
