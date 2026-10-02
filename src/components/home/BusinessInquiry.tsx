import { Check, Mail, Phone } from "lucide-react";
import { companyContent } from "@/lib/content";
import DeferredBusinessInquiryForm from "@/components/home/DeferredBusinessInquiryForm";

const { homeContact, footer } = companyContent;

const businessEmail =
  footer.contact.emails.find((entry) => entry.label === "Business inquiries")
    ?.address ?? footer.contact.email;

/**
 * Home page only: a business-qualifying inquiry form. The careers application
 * form (with CV upload) is separate and lives on the careers page.
 *
 * Shell is server-rendered; only the form island is deferred client JS.
 */
export default function BusinessInquiry() {
  return (
    <section
      id="contact"
      className="closer scroll-mt-24"
      aria-labelledby="business-inquiry-title"
    >
      <div className="ent-shell">
        <div className="closer__panel">
          <div className="closer__intro">
            <p className="ent-eyebrow">{homeContact.label}</p>
            <h2 id="business-inquiry-title" className="ent-title">
              {homeContact.title} <em>{homeContact.highlight}</em>
            </h2>
            <p className="ent-lede">{homeContact.subtitle}</p>

            <ul className="closer__assurances">
              {homeContact.assurances.map((item) => (
                <li key={item}>
                  <Check size={15} strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="closer__contacts">
              <a href={`mailto:${businessEmail}`} className="closer__contact">
                <Mail size={16} aria-hidden />
                {businessEmail}
              </a>
              {footer.phones.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="closer__contact"
                >
                  <Phone size={16} aria-hidden />
                  {phone.label}
                </a>
              ))}
            </div>
          </div>

          <DeferredBusinessInquiryForm />
        </div>
      </div>
    </section>
  );
}
