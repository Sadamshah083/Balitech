"use client";

import { Globe, Headphones, Shield, Target, Users, Zap } from "lucide-react";
import BentoTilt from "@/components/animations/BentoTilt";
import SectionTitle from "@/components/brand/SectionTitle";
import { companyContent } from "@/lib/content";

const { excellence, vision, mission } = companyContent;
const featureIcons = [Headphones, Users, Shield, Target, Globe, Zap];

export default function CallCenterFeatures() {
  return (
    <section className="section-gradient py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          label={excellence.label}
          title={excellence.title}
          highlight={excellence.highlight}
          subtitle={`${vision.text} ${mission.tagline}`}
          centered
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-12 text-center">
            <p className="brand-label mb-2">{companyContent.name}</p>
            <h3 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
              <span className="text-orange">Bali</span>
              <span className="text-muted mx-2">•</span>
              <span className="text-foreground">Tech</span>
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {excellence.features.map((feature, index) => (
              <BentoTilt key={feature.num}>
                <div className="glow-border h-full rounded-2xl bg-card p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm font-bold text-orange">
                      {feature.num}
                    </span>
                    {(() => {
                      const Icon = featureIcons[index];
                      return <Icon size={20} className="text-orange" />;
                    })()}
                  </div>
                  <h3 className="mb-2 font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted">{feature.description}</p>
                </div>
              </BentoTilt>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
