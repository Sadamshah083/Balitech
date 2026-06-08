import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import SitePage from "@/components/layout/SitePage";
import PageBanner from "@/components/layout/PageBanner";
import ContactForm from "@/components/landing/ContactForm";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "Our Offices | Bali Tech Pvt. Ltd",
  description: "Visit or contact Bali Tech offices in Islamabad, Pakistan.",
};

const offices = [
  {
    city: "Islamabad",
    country: "Pakistan",
    address: "Blue Area, Islamabad, Pakistan",
    phone: "+92 300 0000000",
    email: "info@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    image: siteImages.office,
  },
  {
    city: "Rawalpindi",
    country: "Pakistan",
    address: "Commercial Market, Rawalpindi, Pakistan",
    phone: "+92 300 0000001",
    email: "rawalpindi@balitech.com",
    hours: "Mon – Sat: 9:00 AM – 6:00 PM",
    image: siteImages.about,
  },
];

export default function OurOfficesPage() {
  return (
    <SitePage>
      <PageBanner
        title="Our Offices"
        subtitle="Connect with Bali Tech at our locations across Pakistan."
        image={siteImages.office}
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {offices.map((office) => (
            <div
              key={office.city}
              className="glow-border overflow-hidden rounded-2xl bg-card"
            >
              <img
                src={office.image}
                alt={`${office.city} office`}
                className="h-52 w-full object-cover"
              />
              <div className="p-6 md:p-8">
                <h2 className="mb-1 text-2xl font-bold text-foreground">
                  {office.city}
                </h2>
                <p className="mb-6 text-sm text-orange">{office.country}</p>
                <ul className="space-y-4 text-sm text-muted">
                  <li className="flex items-start gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-orange" />
                    {office.address}
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone size={18} className="shrink-0 text-orange" />
                    {office.phone}
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail size={18} className="shrink-0 text-orange" />
                    {office.email}
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock size={18} className="shrink-0 text-orange" />
                    {office.hours}
                  </li>
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
