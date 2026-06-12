"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import type { PublicMediaItem } from "@/lib/media";

type GalleryGridProps = {
  items: PublicMediaItem[];
};

export default function GalleryGrid({ items }: GalleryGridProps) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ["All", ...unique];
  }, [items]);

  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? items
      : items.filter((item) => item.category === active);

  return (
    <section className="section-with-net py-16">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                active === cat
                  ? "bg-orange text-white"
                  : "border border-foreground/15 text-muted hover:border-orange hover:text-orange"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glow-border group overflow-hidden rounded-2xl bg-card"
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt ?? item.title}
                  fill
                  unoptimized={item.src.startsWith("http")}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
