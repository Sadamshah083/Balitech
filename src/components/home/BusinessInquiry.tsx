"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { companyContent } from "@/lib/content";
import { thankYouHref } from "@/lib/thank-you";

const { homeContact, footer } = companyContent;

const SERVICE_OPTIONS = [
  "Customer Support",
  "Inbound & Outbound",
  "Lead Generation",
  "B2B Outreach",
  "Sales & Verification",
  "Business Process Support",
  "Not sure yet",
];

const businessEmail =
  footer.contact.emails.find((entry) => entry.label === "Business inquiries")
    ?.address ?? footer.contact.email;

/**
 * Home page only: a business-qualifying inquiry form. The careers application
 * form (with CV upload) is separate and lives on the careers page.
 */
export default function BusinessInquiry() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const details = [
      form.service ? `Service of interest: ${form.service}` : "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: details,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      router.push(thankYouHref("inquiry"));
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        message: "",
      });
    } catch {
      setStatus("error");
    }
  }

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

          <form onSubmit={handleSubmit} className="closer__form">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="business-inquiry__label">Your name *</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="brand-input mt-2 w-full"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="block">
                <span className="business-inquiry__label">Work email *</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="brand-input mt-2 w-full"
                  placeholder="jane@company.com"
                />
              </label>
              <label className="block">
                <span className="business-inquiry__label">Company</span>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className="brand-input mt-2 w-full"
                  placeholder="Company name"
                />
              </label>
              <label className="block">
                <span className="business-inquiry__label">Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="brand-input mt-2 w-full"
                  placeholder="+1 555 000 0000"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="business-inquiry__label">
                What do you need to run?
              </span>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="brand-input mt-2 w-full"
              >
                <option value="">Select a service</option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="business-inquiry__label">
                Tell us about the campaign
              </span>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="brand-input mt-2 w-full resize-none"
                placeholder="Volume, target market, hours you need covered, and anything else that matters."
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="ent-btn mt-7 w-full disabled:opacity-60"
            >
              {status === "loading" ? "Sending..." : "Send Inquiry"}
              {status !== "loading" && (
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              )}
            </button>

            <p className="mt-4 text-center text-xs text-muted" aria-live="polite">
              {status === "success"
                ? "Thank you — our operations team will be in touch."
                : status === "error"
                  ? "Something went wrong. Please email us directly."
                  : "We reply to business inquiries within one working day."}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
