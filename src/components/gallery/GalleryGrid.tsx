"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import type { PublicMediaItem } from "@/lib/media";

const PAGE_SIZE = 12;

type GalleryGridProps = {
  items: PublicMediaItem[];
};

export default function GalleryGrid({ items }: GalleryGridProps) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ["All", ...unique];
  }, [items]);

  const [active, setActive] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered =
    active === "All"
      ? items
      : items.filter((item) => item.category === active);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  function switchCategory(cat: string) {
    setActive(cat);
    setVisible(PAGE_SIZE);
  }

  return (
    <section className="section-with-net py-16">
      <SectionAnimatedNet />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => switchCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                active === cat
                  ? "bg-orange text-[#10192e]"
                  : "border border-foreground/15 text-muted hover:border-orange hover:text-orange"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <div
              key={item.id}
              className="glow-border group overflow-hidden rounded-2xl bg-card"
            >
              <div
                className={`relative overflow-hidden ${
                  item.category === "Fruit Day" ? "h-64 sm:h-72" : "h-56"
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.alt ?? item.title}
                  fill
                  unoptimized={item.src.startsWith("http")}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition duration-500 group-hover:scale-105${
                    item.category === "Fruit Day"
                      ? " object-contain bg-background p-1"
                      : ""
                  }`}
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-foreground">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-full border border-orange/40 px-8 py-3 text-sm font-bold uppercase tracking-wider text-orange transition hover:bg-orange hover:text-on-primary"
            >
              Load More ({filtered.length - visible} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
