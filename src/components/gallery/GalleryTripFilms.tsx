"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { companyContent } from "@/lib/content";
import { siteImages } from "@/lib/images";

const { annualTrips } = companyContent.about;
const { videos } = siteImages.aboutCollage;

const FILMS = [
  { id: "trip2k26", video: videos.trip2k26, copy: annualTrips.trip2k26 },
  { id: "trip2k25", video: videos.trip2k25, copy: annualTrips.trip2k25 },
  { id: "managementTrip", video: videos.managementTrip, copy: annualTrips.managementTrip },
] as const;

type Film = (typeof FILMS)[number];

/**
 * The clips run 19–25 MB each, so the card ships as a poster and only mounts a
 * `<video>` once the visitor presses play. Nothing is fetched before then, and
 * three films on one page cost three images instead of 65 MB.
 */
function FilmCard({ film, featured }: { film: Film; featured?: boolean }) {
  const [playing, setPlaying] = useState(false);

  return (
    <article
      className={`trip-film${featured ? " trip-film--featured" : ""}`}
    >
      <div className="trip-film__stage">
        {playing ? (
          <video
            className="trip-film__video"
            src={film.video.src}
            poster={film.video.poster}
            controls
            autoPlay
            playsInline
            preload="auto"
            aria-label={film.copy.title}
          />
        ) : (
          <button
            type="button"
            className="trip-film__trigger"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${film.copy.title}`}
          >
            <Image
              src={film.video.poster}
              alt=""
              fill
              aria-hidden
              className="trip-film__poster"
              sizes={
                featured
                  ? "(max-width: 900px) 100vw, 76rem"
                  : "(max-width: 900px) 100vw, 38rem"
              }
            />
            <span className="trip-film__scrim" aria-hidden />
            <span className="trip-film__play" aria-hidden>
              <Play size={featured ? 26 : 20} strokeWidth={2.5} />
            </span>
          </button>
        )}
      </div>

      <div className="trip-film__meta">
        <h3 className="trip-film__title">{film.copy.title}</h3>
        <p className="trip-film__subtitle">{film.copy.subtitle}</p>
      </div>
    </article>
  );
}

export default function GalleryTripFilms() {
  const [featured, ...rest] = FILMS;

  return (
    <section className="trip-films" aria-labelledby="trip-films-title">
      <div className="ent-shell">
        <header className="trip-films__head">
          <p className="ent-eyebrow">Trip Films</p>
          <h2 id="trip-films-title" className="ent-title">
            Annual Trips <em>On Film</em>
          </h2>
          <p className="ent-lede">
            Full-length footage from our annual team trips and management
            retreats.
          </p>
        </header>

        <div className="trip-films__grid">
          <FilmCard film={featured} featured />
          {rest.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </div>
    </section>
  );
}
