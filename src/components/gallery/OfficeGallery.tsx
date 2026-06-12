"use client";

import Image from "next/image";
import BentoTilt from "@/components/animations/BentoTilt";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import type { PublicMediaItem } from "@/lib/media";

type OfficeGalleryProps = {
  items: PublicMediaItem[];
};

export default function OfficeGallery({ items }: OfficeGalleryProps) {
  const sorted = [...items].sort((a, b) => {
    if (a.isFeatured === b.isFeatured) return a.order - b.order;
    return a.isFeatured ? -1 : 1;
  });

  const [featured, ...rest] = sorted;

  if (!featured) return null;

  return (
    <section id="office" className="section-with-net py-14 lg:py-16">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center md:mb-12">
          <p className="brand-label mb-3">Our Workspace</p>
          <h2 className="brand-heading text-3xl sm:text-4xl md:text-5xl">
            <HeadingLastWord text="Life At BALITECH Office" />
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted md:text-base">
            A look inside our offices — where teams collaborate, grow, and deliver
            excellence every day.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:gap-6">
          <BentoTilt className="md:row-span-2">
            <div className="office-gallery-card office-gallery-card--featured glow-border overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[min(52vw,560px)]">
                <Image
                  src={featured.src}
                  alt={featured.alt ?? featured.title}
                  fill
                  priority
                  unoptimized={featured.src.startsWith("http")}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 md:p-6">
                  <span className="mb-2 inline-block rounded-full bg-orange/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Office
                  </span>
                  <h3 className="text-lg font-bold text-white md:text-xl">
                    {featured.title}
                  </h3>
                </div>
              </div>
            </div>
          </BentoTilt>

          {rest.map((item) => (
            <BentoTilt key={item.id}>
              <div className="office-gallery-card glow-border overflow-hidden rounded-2xl">
                <div className="relative aspect-[16/10] w-full md:aspect-[16/11]">
                  <Image
                    src={item.src}
                    alt={item.alt ?? item.title}
                    fill
                    unoptimized={item.src.startsWith("http")}
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                    <span className="mb-1.5 inline-block rounded-full bg-orange/90 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white">
                      Office
                    </span>
                    <h3 className="text-sm font-bold text-white md:text-base">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            </BentoTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
