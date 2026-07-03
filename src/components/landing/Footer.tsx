import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import SocialPlatformIcon from "@/components/brand/SocialPlatformIcon";
import { companyContent } from "@/lib/content";
import { applyNowLabel, joinUsHref, navLinks } from "@/lib/navigation";

const { footer, tagline } = companyContent;

type SocialLink = (typeof footer.socialBranches)[number]["links"][number];
type SocialBranch = (typeof footer.socialBranches)[number];

function SocialLinkItem({ link }: { link: SocialLink }) {
  const icon = <SocialPlatformIcon platform={link.platform} size={17} />;

  if (!link.href) {
    return (
      <span
        className="footer-social-icon footer-social-icon--round footer-social-icon--placeholder"
        aria-label={`${link.label} — coming soon`}
      >
        {icon}
      </span>
    );
  }

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      className="footer-social-icon footer-social-icon--round brand-icon-wrap transition hover:bg-orange hover:text-on-primary"
    >
      {icon}
    </a>
  );
}

function SocialBranchBlock({ branch }: { branch: SocialBranch }) {
  return (
    <div className="footer-social-branch">
      <h5 className="footer-social-branch__title">{branch.title}</h5>
      <div className="footer-social-branch__icons">
        {branch.links.map((link) => (
          <SocialLinkItem key={`${branch.title}-${link.platform}`} link={link} />
        ))}
      </div>
    </div>
  );
}

function getBranch(title: string) {
  const branch = footer.socialBranches.find((item) => item.title === title);
  if (!branch) {
    throw new Error(`Missing footer social branch: ${title}`);
  }
  return branch;
}

export default function Footer() {
  return (
    <footer className="border-t border-orange/25 bg-surface py-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <BrandLogo
            href="/"
            width={240}
            height={46}
            imageClassName="max-w-[10rem] sm:max-w-[11rem]"
            className="mb-4"
          />
          <p className="text-sm leading-relaxed text-muted">
            {footer.description}
          </p>
          <p className="mt-3 text-sm font-semibold italic text-orange">
            &ldquo;{tagline}&rdquo;
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-foreground">Quick Links</h4>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted transition hover:text-orange"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={joinUsHref}
                className="btn-primary inline-flex rounded-lg px-4 py-1.5 text-sm font-bold uppercase tracking-wider"
              >
                {applyNowLabel}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-foreground">Contact Us</h4>
          <ul className="space-y-3 text-sm text-muted">
            {footer.phones.map((phone) => (
              <li key={phone.href} className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-orange" aria-hidden />
                <a href={phone.href} className="font-semibold text-foreground hover:text-orange">
                  {phone.label}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-orange" />
              <a href={`mailto:${footer.contact.email}`} className="hover:text-orange">
                {footer.contact.email}
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-social-section sm:col-span-2 lg:col-span-1">
          <h4 className="mb-4 font-bold text-foreground">Follow Us</h4>
          <div className="footer-social-board">
            <div className="footer-social-board__col footer-social-board__col--active">
              <SocialBranchBlock branch={getBranch("Commercial Branch")} />
              <SocialBranchBlock branch={getBranch("Shamsabad Branch")} />
            </div>
            <div className="footer-social-board__col footer-social-board__col--inactive">
              <SocialBranchBlock branch={getBranch("Iran Road Branch")} />
              <SocialBranchBlock branch={getBranch("I-9/3 Branch")} />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-locations mx-auto mt-12 max-w-7xl border-t border-foreground/10 px-4 pt-8 sm:px-6 lg:px-8">
        <h4 className="footer-locations__heading">Our Offices</h4>
        <div className="footer-locations__grid">
          {footer.locations.map((location) => (
            <div key={location.name} className="footer-locations__item">
              <h5 className="footer-locations__name">{location.name}</h5>
              <p className="footer-locations__address">
                <MapPin size={14} className="footer-locations__pin" aria-hidden />
                {location.address}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 text-center text-sm text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Bali Tech Pvt. Ltd. All rights reserved.
      </div>
    </footer>
  );
}
