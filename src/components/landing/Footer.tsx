import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import SocialPlatformIcon from "@/components/brand/SocialPlatformIcon";
import FooterWebsiteQr from "@/components/landing/FooterWebsiteQr";
import { companyContent } from "@/lib/content";
import { applyNowLabel, joinUsHref, navLinks } from "@/lib/navigation";
import { getPublicOffices, officePhoneLinks } from "@/lib/offices";
import { serviceHref } from "@/lib/service-pages";

const { footer, tagline } = companyContent;

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/recruitment-privacy-notice", label: "Recruitment Privacy Notice" },
] as const;

type SocialLink = (typeof footer.socialBranches)[number]["links"][number];
type SocialBranch = (typeof footer.socialBranches)[number];

function SocialLinkItem({ link }: { link: SocialLink }) {
  const icon = <SocialPlatformIcon platform={link.platform} size={17} />;

  if (!link.href) {
    return (
      <span
        className="footer-social-icon footer-social-icon--round footer-social-icon--placeholder"
        role="img"
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
      <h3 className="footer-social-branch__title">{branch.title}</h3>
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

export default async function Footer() {
  /* Each office's own numbers, from the Offices admin (fallback list when the
     database is unavailable). Editing an office there updates the footer on
     the next visit, since admin writes refresh every public page. */
  const offices = (await getPublicOffices())
    .map((office) => ({ name: office.name, phones: officePhoneLinks(office.phone) }))
    .filter((office) => office.phones.length > 0);

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
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
          <FooterWebsiteQr />
        </div>

        <div>
          <h2 className="mb-4 font-bold text-foreground">Quick Links</h2>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                {/* Not prefetched. These eight sit at the bottom of every page,
                    so they come into view while the visitor is scrolling and
                    Next would fetch all eight routes right then — on the one
                    thread that is trying to keep the scroll smooth, for links
                    that are a fallback rather than the way through the site.
                    The same eight are in the header, where hovering warms them
                    (see IntentLink), so a real click still lands warm. */}
                <Link
                  href={link.href}
                  prefetch={false}
                  className="text-sm text-muted transition hover:text-orange"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={joinUsHref}
                prefetch={false}
                className="btn-primary inline-flex rounded-lg px-4 py-1.5 text-sm font-bold uppercase tracking-wider"
              >
                {applyNowLabel}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-bold text-foreground">Contact Us</h2>
          <ul className="space-y-3 text-sm text-muted">
            {offices.map((office) => (
              <li key={office.name} className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0 text-orange" aria-hidden />
                <span>
                  <span className="block text-xs uppercase tracking-wider text-muted/70">
                    {office.name}
                  </span>
                  <span className="flex flex-wrap gap-x-2">
                    {office.phones.map((phone, index) => (
                      <span key={phone.href} className="whitespace-nowrap">
                        {index > 0 && (
                          <span className="mr-2 text-muted/50" aria-hidden>
                            /
                          </span>
                        )}
                        <a
                          href={phone.href}
                          className="font-semibold text-foreground hover:text-orange"
                        >
                          {phone.label}
                        </a>
                      </span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
            {footer.contact.emails.map((entry) => (
              <li key={entry.label} className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0 text-orange" />
                <span>
                  <span className="block text-xs uppercase tracking-wider text-muted/70">
                    {entry.label}
                  </span>
                  <a
                    href={`mailto:${entry.address}`}
                    className="font-medium text-foreground hover:text-orange"
                  >
                    {entry.address}
                  </a>
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mb-3 mt-8 font-bold text-foreground">Our Services</h2>
          <ul className="space-y-1.5">
            {companyContent.solutions.items.map((service) => (
              <li key={service.id}>
                <Link
                  href={serviceHref(service.id)}
                  prefetch={false}
                  className="text-sm text-muted transition hover:text-orange"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-social-section sm:col-span-2 lg:col-span-1">
          <h2 className="mb-4 font-bold text-foreground">Follow Us</h2>
          <div className="footer-social-board">
            <SocialBranchBlock branch={getBranch("Commercial Branch")} />
            <SocialBranchBlock branch={getBranch("Iran Road Branch")} />
            <SocialBranchBlock branch={getBranch("Shamsabad Branch")} />
            <SocialBranchBlock branch={getBranch("I-9/3 Branch")} />
          </div>
        </div>
      </div>

      <div className="site-footer__baseline">
        <p>© {new Date().getFullYear()} Bali Tech Pvt. Ltd. All rights reserved.</p>
        <ul className="site-footer__legal">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} prefetch={false}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
