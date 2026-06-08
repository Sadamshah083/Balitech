import Link from "next/link";
import { Globe, Mail, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";
import { companyContent } from "@/lib/content";
import { joinUsHref, navLinks } from "@/lib/navigation";

const { footer, tagline } = companyContent;

export default function Footer() {
  return (
    <footer className="border-t border-orange/25 bg-surface py-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <div className="mb-4 flex items-baseline gap-1.5">
            <span className="text-xl font-black uppercase tracking-tight text-orange">
              Bali
            </span>
            <span className="text-muted">•</span>
            <span className="text-xl font-black uppercase tracking-tight text-foreground">
              Tech
            </span>
          </div>
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
                className="text-sm text-muted transition hover:text-orange"
              >
                Join Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-foreground">Contact Us</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-orange" />
              Rawalpindi, Pakistan
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-orange" />
              <a href="tel:+923318638312" className="hover:text-orange">
                0331 8638312
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-orange" />
              info@balitech.com
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-foreground">Follow Us</h4>
          <div className="flex gap-3">
            {[Share2, MessageCircle, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="rounded-full border border-orange/40 p-2.5 text-orange transition hover:bg-orange hover:text-on-primary"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-foreground/10 px-4 pt-8 text-center text-sm text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Bali Tech Pvt. Ltd. All rights reserved.
      </div>
    </footer>
  );
}
