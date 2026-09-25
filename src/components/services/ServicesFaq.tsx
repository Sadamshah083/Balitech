import { Plus } from "lucide-react";
import { companyContent } from "@/lib/content";

const { servicesFaq } = companyContent;

/**
 * Services page only. Native <details> keeps this a server component and
 * keeps every answer in the initial HTML for search engines.
 */
export default function ServicesFaq() {
  return (
    <section
      id="faq"
      className="ent-section ent-section--raised"
      aria-labelledby="services-faq-title"
    >
      <div className="ent-shell">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <header className="ent-head">
            <p className="ent-eyebrow">{servicesFaq.label}</p>
            <h2 id="services-faq-title" className="ent-title">
              {servicesFaq.title} <em>{servicesFaq.highlight}</em>
            </h2>
          </header>

          <div className="faq-list">
            {servicesFaq.items.map((item) => (
              <details key={item.q} className="faq-item">
                <summary className="faq-item__q">
                  <span>{item.q}</span>
                  <Plus
                    size={18}
                    strokeWidth={2}
                    className="faq-item__icon"
                    aria-hidden
                  />
                </summary>
                <p className="faq-item__a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
