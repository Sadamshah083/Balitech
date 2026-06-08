import { Globe, MessageCircle, Share2, Video } from "lucide-react";
import { siteImages } from "@/lib/images";

export default function MediaSection() {
  return (
    <section id="press-release" className="section-gradient py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Beyond The Call By Bali Tech
          </h2>
          <div className="flex gap-4">
            {[Share2, MessageCircle, Globe, Video].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="rounded-full border border-orange/40 p-3 text-orange transition hover:bg-orange hover:text-on-primary"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {siteImages.media.map((image, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl glow-border"
            >
              <img
                src={image}
                alt="Beyond the call"
                className="h-56 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <p className="text-xl font-bold uppercase tracking-widest text-white">
                  Beyond The Call
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
