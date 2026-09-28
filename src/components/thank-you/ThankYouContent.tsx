"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import { pushDataLayer } from "@/lib/analytics";
import { readApplicationReference, type ThankYouForm } from "@/lib/thank-you";

const COPY = {
  application: {
    title: "Application received",
    body: "Thank you for applying to BALITECH. Our recruitment team reviews every application and will contact you if you are shortlisted.",
    primary: { label: "View More Openings", href: "/join-us" },
  },
  inquiry: {
    title: "Thank you for reaching out",
    body: "Your inquiry has reached our operations team. We reply to business inquiries within one working day.",
    primary: { label: "Explore Our Services", href: "/services" },
  },
} as const;

function asForm(value: string | null): ThankYouForm | null {
  return value === "application" || value === "inquiry" || value === "contact"
    ? value
    : null;
}

export function ThankYouView({ form }: { form: ThankYouForm | null }) {
  const [reference, setReference] = useState<string | null>(null);
  const copy = form === "application" ? COPY.application : COPY.inquiry;

  useEffect(() => {
    if (form !== "application") return;
    const stored = readApplicationReference();
    if (stored) requestAnimationFrame(() => setReference(stored));
  }, [form]);

  return (
    <section className="relative px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <div className="admin-card glow-border mx-auto max-w-2xl rounded-2xl bg-card p-8 text-center sm:p-12">
        <CheckCircle2
          size={56}
          strokeWidth={1.75}
          className="mx-auto text-orange"
          aria-hidden
        />
        <h1 className="mt-6 text-3xl font-extrabold text-foreground sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">
          {copy.body}
        </p>

        {reference && (
          <p className="mt-6 text-sm text-muted">
            Your reference number is{" "}
            <strong className="font-bold text-foreground">{reference}</strong>.
            Please quote it if you contact us about this application.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <IntentLink href={copy.primary.href} className="ent-btn">
            {copy.primary.label}
            <ArrowRight size={16} aria-hidden />
          </IntentLink>
          <IntentLink href="/" className="ent-btn ent-btn--ghost">
            Back to Home
          </IntentLink>
        </div>
      </div>
    </section>
  );
}

/**
 * Reads which form was submitted and records the conversion. The page URL is
 * enough for a GA4/GTM page-view trigger; the data-layer event is there for
 * GTM tags that want the form type as a variable.
 */
export default function ThankYouContent() {
  const form = asForm(useSearchParams().get("form"));
  const recorded = useRef(false);

  useEffect(() => {
    /* Once per visit, so a re-run effect cannot count a conversion twice. */
    if (recorded.current) return;
    recorded.current = true;
    pushDataLayer({ event: "form_submit_success", form_type: form ?? "unknown" });
  }, [form]);

  return <ThankYouView form={form} />;
}
