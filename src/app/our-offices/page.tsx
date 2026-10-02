import Image from "next/image";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { getPublicOffices } from "@/lib/offices";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";

export const metadata = pageMetadata({
  title: "Our Offices in Rawalpindi & Islamabad",
  description:
    "Visit Bali Tech offices in Shamsabad, Satellite Town, Iran Road (Rawalpindi) and I-9/3 (Islamabad). Call 0370 0585660 or 0327 1233435.",
  path: "/our-offices",
});

export default async function OurOfficesPage() {
  const offices = await getPublicOffices();

  return (
    <SitePage>
      <JsonLd
        data={breadcrumbSchema([{ name: "Offices", path: "/our-offices" }])}
      />
      <PageBanner
        title="Our Offices"
        subtitle="Connect with Bali Tech at our locations across Pakistan."
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
                <div className="relative aspect-[16/10] w-full bg-blue-dark/40">
                  <Image
                    src={office.image}
                    alt={`${office.name} building`}
                    fill
                    unoptimized={
                      office.image.startsWith("http") ||
                      office.image.startsWith("/uploads/")
                    }
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="p-6 md:p-8">
                <h2 className="mb-1 text-xl font-bold leading-snug text-foreground md:text-2xl">
                  {office.name}
                </h2>
                <p className="mb-6 text-sm text-orange">
                  {[office.city, office.country].filter(Boolean).join(", ")}
                </p>
                <ul className="space-y-4 text-sm text-muted">
                  {office.address !== office.name && (
                    <li className="flex items-start gap-3">
                      <MapPin size={18} className="mt-0.5 shrink-0 text-orange" />
                      <span>{office.address}</span>
                    </li>
                  )}
                  {office.phone && (
                    <li className="flex items-center gap-3">
                      <Phone size={18} className="shrink-0 text-orange" />
                      <a
                        href={`tel:${office.phone.replace(/\s/g, "")}`}
                        className="hover:text-orange"
                      >
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
    </SitePage>
  );
}
