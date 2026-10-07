"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { DEPARTMENTS } from "@/lib/careers/catalog";
import type { InquiryVariant } from "@/components/home/BusinessInquiryForm";

const SERVICE_OPTIONS = [
  "Customer Support",
  "Inbound & Outbound",
  "Lead Generation",
  "B2B Outreach",
  "Sales & Verification",
  "Business Process Support",
  "Not sure yet",
];

const JOB_OPTIONS = [
  ...DEPARTMENTS.flatMap((dept) => dept.positions.map((p) => p.title)),
  "Other / Not sure yet",
];

type Props = {
  variant?: InquiryVariant;
};

/** Same markup as the live form, without handlers — keeps layout identical. */
function FormPlaceholder({ variant = "business" }: Props) {
  const isJob = variant === "job";
  const options = isJob ? JOB_OPTIONS : SERVICE_OPTIONS;

  return (
    <form className="closer__form" aria-busy>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="business-inquiry__label">Your name *</span>
          <input
            type="text"
            required
            className="brand-input mt-2 w-full"
            placeholder="Jane Doe"
          />
        </label>
        <label className="block">
          <span className="business-inquiry__label">
            {isJob ? "Email *" : "Work email *"}
          </span>
          <input
            type="email"
            required
            className="brand-input mt-2 w-full"
            placeholder={isJob ? "jane@email.com" : "jane@company.com"}
          />
        </label>
        <label className="block">
          <span className="business-inquiry__label">
            {isJob ? "Current company" : "Company"}
          </span>
          <input
            type="text"
            className="brand-input mt-2 w-full"
            placeholder={isJob ? "Optional" : "Company name"}
          />
        </label>
        <label className="block">
          <span className="business-inquiry__label">Phone</span>
          <input
            type="tel"
            className="brand-input mt-2 w-full"
            placeholder="+1 555 000 0000"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="business-inquiry__label">
          {isJob ? "Which role are you interested in?" : "What do you need to run?"}
        </span>
        <select className="brand-input mt-2 w-full" defaultValue="">
          <option value="">{isJob ? "Select a role" : "Select a service"}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="business-inquiry__label">
          {isJob ? "Tell us about your experience" : "Tell us about the campaign"}
        </span>
        <textarea
          rows={4}
          className="brand-input mt-2 w-full resize-none"
          placeholder={
            isJob
              ? "Experience, preferred branch, shift availability, and anything else that helps HR."
              : "Volume, target market, hours you need covered, and anything else that matters."
          }
        />
      </label>

      <button type="button" className="ent-btn mt-7 w-full">
        Send Inquiry
      </button>

      <p className="mt-4 text-center text-xs text-muted">
        {isJob
          ? "We reply to job inquiries within one working day."
          : "We reply to business inquiries within one working day."}
      </p>
    </form>
  );
}

/**
 * Loads the interactive form when near the viewport so its client JS stays
 * out of the Lighthouse quiet window.
 */
export default function DeferredBusinessInquiryForm({
  variant = "business",
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [Form, setForm] = useState<ComponentType<{ variant?: InquiryVariant }> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    const el = shellRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void import("@/components/home/BusinessInquiryForm").then((mod) => {
          if (!cancelled) setForm(() => mod.default);
        });
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={shellRef}>
      {Form ? <Form variant={variant} /> : <FormPlaceholder variant={variant} />}
    </div>
  );
}
