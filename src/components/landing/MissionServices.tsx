import { Phone, Target, TrendingUp } from "lucide-react";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { mission, vision } = companyContent;

const services = [
  {
    icon: Phone,
    title: vision.label,
    description: vision.text,
  },
  {
    icon: Target,
    title: mission.label,
    description: mission.text,
  },
  {
    icon: TrendingUp,
    title: mission.tagline,
    description: companyContent.about.description,
  },
];

export default function MissionServices() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
          {mission.tagline}
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted">
          {mission.text}
        </p>

        <div className="mb-12 grid gap-8 sm:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="text-center">
              <div className="mx-auto mb-4 inline-flex rounded-full bg-orange/10 p-5 text-orange">
                <service.icon size={36} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {service.title}
              </h3>
              <p className="text-sm text-muted">{service.description}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl glow-border">
          <img
            src={siteImages.office}
            alt="Modern office"
            className="h-64 w-full object-cover md:h-80"
          />
        </div>
      </div>
    </section>
  );
}
