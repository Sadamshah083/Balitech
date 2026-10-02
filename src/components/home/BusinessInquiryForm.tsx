"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { thankYouHref } from "@/lib/thank-you";

const SERVICE_OPTIONS = [
  "Customer Support",
  "Inbound & Outbound",
  "Lead Generation",
  "B2B Outreach",
  "Sales & Verification",
  "Business Process Support",
  "Not sure yet",
];

/**
 * Interactive half of the home closer — deferred until near the viewport so
 * form state and the router stay out of the initial client graph.
 */
export default function BusinessInquiryForm() {
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
            onChange={(e) => setForm({ ...form, company: e.target.value })}
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
        <span className="business-inquiry__label">What do you need to run?</span>
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
  );
}
