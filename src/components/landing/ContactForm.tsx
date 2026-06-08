"use client";

import { useEffect, useState } from "react";
import AnimatedTitle from "@/components/animations/AnimatedTitle";
import BentoTilt from "@/components/animations/BentoTilt";
import { getCampaignFromSearch } from "@/lib/apply";

export default function ContactForm() {
  const [campaign, setCampaign] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    const selectedCampaign = getCampaignFromSearch(window.location.search);

    if (selectedCampaign) {
      setCampaign(selectedCampaign);
      setForm((prev) => ({
        ...prev,
        message:
          prev.message ||
          `I would like to apply for the ${selectedCampaign} campaign.`,
      }));
    }

    if (window.location.hash === "#contact") {
      requestAnimationFrame(() => {
        document.getElementById("contact")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const payload = {
      ...form,
      message: campaign
        ? `[Campaign: ${campaign}] ${form.message}`.trim()
        : form.message,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
      setCampaign(null);
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="brand-label mb-4">Contact</p>
          <AnimatedTitle containerClass="mx-auto max-w-2xl">
            Get In Touch
          </AnimatedTitle>
          <p className="mx-auto mt-6 max-w-xl text-muted">
            Ready to outsource? Send us a message and our team will reach out.
          </p>
        </div>

        <BentoTilt>
          <form
            onSubmit={handleSubmit}
            className="glow-border space-y-5 rounded-2xl bg-card p-8"
          >
            {campaign && (
              <div className="rounded-xl border border-orange/40 bg-orange/10 px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-orange">
                  Applying for
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {campaign}
                </p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your Name *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="brand-input w-full"
              />
              <input
                type="email"
                placeholder="Email Address *"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="brand-input w-full"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="brand-input w-full"
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <textarea
              placeholder="Your Message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="brand-input w-full resize-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary w-full rounded-full py-4 font-bold uppercase tracking-wider disabled:opacity-60"
            >
              {status === "loading"
                ? "Sending..."
                : campaign
                  ? "Submit Application"
                  : "Submit Inquiry"}
            </button>
            {status === "success" && (
              <p className="text-center text-sm text-orange">
                Thank you! We&apos;ll be in touch soon.
              </p>
            )}
            {status === "error" && (
              <p className="text-center text-sm text-red-400">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </BentoTilt>
      </div>
    </section>
  );
}
