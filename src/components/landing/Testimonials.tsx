import { Quote } from "lucide-react";
import { companyContent } from "@/lib/content";

const { testimonials } = companyContent.proof;

/**
 * Renders nothing until real, attributable client quotes are available.
 */
export default function Testimonials() {
  if (testimonials.items.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="voices"
      aria-labelledby="testimonials-title"
    >
      <div className="ent-shell voices__shell">
        <div className="voices__intro">
          <p className="ent-eyebrow">{testimonials.label}</p>
          <h2 id="testimonials-title" className="ent-title">
            {testimonials.title} <em>{testimonials.highlight}</em>
          </h2>
          <p className="ent-lede">
            What our partners say about working with BALITECH.
          </p>
        </div>

        <ul className="voices__list">
          {testimonials.items.map((item) => (
            <li key={`${item.name}-${item.company}`}>
              <figure className="voice-card">
                <Quote className="voice-card__glyph" size={34} aria-hidden />

                <blockquote className="voice-card__quote">
                  {item.quote}
                </blockquote>

                <figcaption className="voice-card__author">
                  <span className="voice-card__avatar" aria-hidden>
                    {item.name.charAt(0)}
                  </span>
                  <span>
                    <span className="voice-card__name">{item.name}</span>
                    <span className="voice-card__role">
                      {item.position} · {item.company}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
