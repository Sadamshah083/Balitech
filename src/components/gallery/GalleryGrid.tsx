"use client";

import { useState } from "react";
import { siteImages } from "@/lib/images";

const categories = ["All", "Events", "Awards", "Team", "Training", "Office"];

export default function GalleryGrid() {
  const [active, setActive] = useState("All");
  const items = siteImages.gallery.items;

  const filtered =
    active === "All"
      ? items
      : items.filter((item) => item.category === active);

  return (
    <section className="py-16">
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
              key={item.title}
              className="glow-border group overflow-hidden rounded-2xl bg-card"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 rounded-full bg-orange/90 px-3 py-1 text-xs font-bold uppercase text-white">
                  {item.category}
                </div>
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
