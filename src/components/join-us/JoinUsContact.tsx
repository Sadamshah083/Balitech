import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { companyContent } from "@/lib/content";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import type { PublicOffice } from "@/lib/offices";

const { joinUs } = companyContent;

type JoinUsContactProps = {
  headOffice?: PublicOffice | null;
};

export default function JoinUsContact({ headOffice }: JoinUsContactProps) {
  const address =
    headOffice?.address ?? joinUs.appointment.address;
  const mapEmbedUrl =
    headOffice?.mapEmbedUrl ?? joinUs.appointment.mapEmbedUrl;
  const mapTitle = headOffice
    ? `${headOffice.name} location map`
    : joinUs.appointment.mapTitle;
  const phone = headOffice?.phone ?? joinUs.contact.phone;
  const phoneHref = phone
    ? `tel:${phone.replace(/\s/g, "")}`
    : joinUs.contact.phoneHref;
  const email = headOffice?.email ?? joinUs.contact.email;
  const hours = headOffice?.hours ?? joinUs.contact.hours;

  return (
    <section className="join-us-contact section-with-net" aria-labelledby="join-us-appointment-title">
      <SectionAnimatedNet />
      <div className="join-us-contact__inner">
        <div className="join-us-contact__map-wrap">
          <iframe
            title={mapTitle}
            src={mapEmbedUrl}
            className="join-us-contact__map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="join-us-contact__map-badge">
            <MapPin size={16} aria-hidden />
            <span>{address}</span>
          </div>
        </div>

        <h2 id="join-us-appointment-title" className="join-us-contact__appointment">
          {joinUs.appointment.title}
        </h2>

        <div className="join-us-contact__grid">
          <div className="join-us-contact__item">
            <span className="join-us-contact__icon" aria-hidden>
              <Clock size={22} strokeWidth={1.75} />
            </span>
            <div>
              <p className="join-us-contact__label">{joinUs.contact.hoursLabel}</p>
              <p className="join-us-contact__value">{hours}</p>
            </div>
          </div>
          <div className="join-us-contact__item">
            <span className="join-us-contact__icon" aria-hidden>
              <Mail size={22} strokeWidth={1.75} />
            </span>
            <div>
              <p className="join-us-contact__label">{joinUs.contact.emailLabel}</p>
              <a
                href={`mailto:${email}`}
                className="join-us-contact__value join-us-contact__link"
              >
                {email}
              </a>
            </div>
          </div>
          <div className="join-us-contact__item">
            <span className="join-us-contact__icon" aria-hidden>
              <Phone size={22} strokeWidth={1.75} />
            </span>
            <div>
              <p className="join-us-contact__label">{joinUs.contact.phoneLabel}</p>
              <a href={phoneHref} className="join-us-contact__value join-us-contact__link">
                {phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
