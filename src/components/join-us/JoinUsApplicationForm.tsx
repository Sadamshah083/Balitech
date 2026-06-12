"use client";

import { useEffect, useRef, useState } from "react";
import { companyContent } from "@/lib/content";
import { getCampaignFromSearch } from "@/lib/apply";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";

const { joinUs } = companyContent;

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="join-us-form__field">
      <span className="join-us-form__label">
        {label}
        {required && (
          <span className="join-us-form__required" aria-hidden>
            {" "}
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export default function JoinUsApplicationForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [campaign, setCampaign] = useState<string | null>(null);
  const [cvName, setCvName] = useState("");
  const [branches, setBranches] = useState(joinUs.form.branches);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "",
    branch: "",
    position: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    const selectedCampaign = getCampaignFromSearch(window.location.search);
    if (selectedCampaign) {
      requestAnimationFrame(() => {
        setCampaign(selectedCampaign);
      });
    }

    if (window.location.hash === "#apply" || window.location.hash === "#contact") {
      requestAnimationFrame(() => {
        document.getElementById("apply")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, []);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/api/offices?public=true");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.offices?.length) return;

        setBranches([
          { value: "", label: "Select a branch" },
          ...data.offices.map((office: { slug: string; name: string }) => ({
            value: office.slug,
            label: office.name,
          })),
        ]);
      } catch {
        /* keep static fallback */
      }
    }

    loadBranches();
  }, []);

  function buildMessage() {
    const parts: string[] = [];

    if (campaign) parts.push(`Campaign: ${campaign}`);
    if (form.experience) {
      parts.push(
        `BPO Experience: ${form.experience === "yes" ? "Yes" : "No (Fresher)"}`
      );
    }
    if (form.branch) {
      const branchLabel =
        branches.find((b) => b.value === form.branch)?.label ?? form.branch;
      parts.push(`Branch: ${branchLabel}`);
    }
    if (form.position) {
      const positionLabel =
        joinUs.form.positions.find((p) => p.value === form.position)?.label ??
        form.position;
      parts.push(`Position: ${positionLabel}`);
    }
    if (cvName) parts.push(`CV File: ${cvName}`);
    if (form.message.trim()) parts.push(form.message.trim());

    return parts.join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const payload = {
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email,
      phone: form.phone,
      company: form.branch
        ? branches.find((b) => b.value === form.branch)?.label
        : null,
      message: buildMessage(),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        experience: "",
        branch: "",
        position: "",
        message: "",
      });
      setCvName("");
      setCampaign(null);
      window.history.replaceState(null, "", "/join-us#apply");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="apply" className="join-us-form-section section-with-net scroll-mt-24">
      <SectionAnimatedNet />

      <div className="join-us-form-section__inner">
        <form onSubmit={handleSubmit} className="join-us-form">
          <header className="join-us-form__header">
            <h2 className="join-us-form__title">
              <HeadingLastWord text={joinUs.form.title} />
            </h2>
            <p className="join-us-form__subtitle">{joinUs.form.subtitle}</p>
          </header>

          {campaign && (
            <div className="join-us-form__campaign">
              <p className="join-us-form__campaign-label">Applying for campaign</p>
              <p className="join-us-form__campaign-value">{campaign}</p>
            </div>
          )}

          <div className="join-us-form__grid join-us-form__grid--two">
            <FormField label="First Name" required>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="join-us-form__input"
              />
            </FormField>
            <FormField label="Last Name" required>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="join-us-form__input"
              />
            </FormField>
            <FormField label="Phone" required>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="join-us-form__input"
              />
            </FormField>
            <FormField label="Your Email" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="join-us-form__input"
              />
            </FormField>
          </div>

          <div className="join-us-form__stack">
            <FormField label="Do you have previous experience in the BPO industry?" required>
              <select
                required
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="join-us-form__select"
              >
                {joinUs.form.experienceOptions.map((opt) => (
                  <option key={opt.value || "default"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Select a Branch" required>
              <select
                required
                value={form.branch}
                onChange={(e) =>
                  setForm({ ...form, branch: e.target.value, position: "" })
                }
                className="join-us-form__select"
              >
                {branches.map((opt) => (
                  <option key={opt.value || "default"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Position you're applying for" required={Boolean(form.branch)}>
              <select
                required={Boolean(form.branch)}
                disabled={!form.branch}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="join-us-form__select"
              >
                {!form.branch ? (
                  <option value="">
                    {joinUs.form.positionPlaceholderNoBranch}
                  </option>
                ) : (
                  joinUs.form.positions.map((opt) => (
                    <option key={opt.value || "default"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                )}
              </select>
            </FormField>
          </div>

          <FormField label="Your Message (optional)">
            <textarea
              rows={4}
              placeholder={joinUs.form.messagePlaceholder}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="join-us-form__textarea resize-none"
            />
          </FormField>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={(e) => setCvName(e.target.files?.[0]?.name ?? "")}
          />

          <div className="join-us-form__actions">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="join-us-form__btn join-us-form__btn--upload"
            >
              {cvName ? cvName : "Upload CV"}
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="join-us-form__btn join-us-form__btn--submit"
            >
              {status === "loading" ? "Submitting..." : "Submit"}
            </button>
          </div>

          {status === "success" && (
            <p className="join-us-form__status join-us-form__status--success">
              Thank you! Your application has been submitted. Our HR team will contact
              you soon.
            </p>
          )}
          {status === "error" && (
            <p className="join-us-form__status join-us-form__status--error">
              Something went wrong. Please try again.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
