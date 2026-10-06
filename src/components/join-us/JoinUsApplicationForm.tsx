"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Pencil } from "lucide-react";
import { thankYouHref } from "@/lib/thank-you";
import SectionAnimatedNet from "@/components/animations/SectionAnimatedNet";
import { HeadingLastWord } from "@/components/brand/HeadingLastWord";
import { getCampaignFromSearch } from "@/lib/apply";
import { parseCampaignLocations } from "@/lib/campaign-locations";
import { fetchPublicCampaigns } from "@/lib/campaigns-client";
import { fallbackOffices } from "@/lib/fallback-offices";
import { loadGsap } from "@/lib/gsap-register";
import {
  CAMPAIGN_VACANCIES_LABEL,
  DEPARTMENTS,
  EMPLOYEE_HISTORY_OPTIONS,
  EMPLOYMENT_END_OPTIONS,
  ENGLISH_OPTIONS,
  EXPERIENCE_OPTIONS,
  GENERAL_APPLICATION,
  HEARD_ABOUT_OPTIONS,
  HR_TASK_OPTIONS,
  JOIN_OPTIONS,
  isCampaignVacancyId,
  OPEN_CAMPAIGN,
  OPEN_CAMPAIGN_LABEL,
  QUALIFICATION_OPTIONS,
  type Option,
} from "@/lib/careers/catalog";
import {
  QUESTIONS,
  STEPS,
  branchChoices,
  buildSummary,
  campaignChoices,
  describeCvRequirement,
  emptyAnswers,
  experienceQuestion,
  getVisibility,
  hasKnownSource,
  readSource,
  specialistQuestion,
  stepOfField,
  validateApplication,
  type ApplicationAnswers,
  type ApplicationContext,
  type ApplicationSource,
  type BranchInfo,
  type FieldKey,
  type PublicVacancy,
} from "@/lib/careers/application";
import { fallbackVacancies } from "@/lib/careers/fallback-vacancies";
import { RECRUITMENT_PRIVACY_URL } from "@/lib/careers/privacy";
import {
  ChoiceGroup,
  CountedTextarea,
  Field,
  FieldError,
  MultiChoiceGroup,
  PhoneInput,
  RequiredMark,
  inputProps,
} from "./application-fields";

type CampaignInfo = { title: string; locations: string[] };
type Errors = Partial<Record<FieldKey, string>>;

const SUBMIT_ERROR =
  "Your application could not be submitted. Please try again. Your entered details are still available.";

function newSubmissionKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Ad links may name a vacancy by id or by title, and a branch by name or slug. */
function matchVacancy(vacancies: PublicVacancy[], wanted: string | null) {
  if (!wanted) return "";
  if (slug(wanted) === GENERAL_APPLICATION) return GENERAL_APPLICATION;
  const key = slug(wanted);
  return (
    vacancies.find((v) => v.id === wanted)?.id ??
    vacancies.find((v) => slug(v.title) === key)?.id ??
    ""
  );
}

function matchOption(options: Option[], wanted: string | null) {
  if (!wanted) return "";
  const key = slug(wanted);
  return (
    options.find((o) => o.value === wanted || slug(o.value) === key || slug(o.label) === key)?.value ??
    options.find((o) => slug(o.value).startsWith(key))?.value ??
    ""
  );
}

function yearOptions() {
  const now = new Date().getFullYear();
  return Array.from({ length: 31 }, (_, i) => String(now - i));
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function JoinUsApplicationForm() {
  const uid = useId();
  const fid = (field: string) => `${uid}-${field}`;
  const sectionRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const submissionKey = useRef<string>("");
  const presetApplied = useRef(false);

  const [rawAnswers, setAnswers] = useState<ApplicationAnswers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [offices, setOffices] = useState<BranchInfo[]>(() =>
    fallbackOffices.map((o) => ({ name: o.name, address: o.address }))
  );
  const [vacancies, setVacancies] = useState<PublicVacancy[] | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [source, setSource] = useState<ApplicationSource>({
    channel: "",
    campaign: "",
    adId: "",
    medium: "",
    landing: "",
  });
  const [presetCampaign, setPresetCampaign] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const router = useRouter();

  useEffect(() => {
    submissionKey.current = newSubmissionKey();

    function onApplyCampaign(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail !== "string" || !detail.trim()) return;
      setPresetCampaign(detail.trim());
      /* A position picked before this click may not belong to the campaign the
         list is about to narrow to. */
      setAnswers((current) => ({ ...current, vacancyId: "", branch: "" }));
    }
    window.addEventListener("balitech:apply-campaign", onApplyCampaign);
    return () => window.removeEventListener("balitech:apply-campaign", onApplyCampaign);
  }, []);

  useEffect(() => {
    let cancelled = false;

    /* Ad links preselect position, branch and campaign once the vacancy list
       is known. All stay editable; anything that does not match is left blank. */
    function applyLink(list: PublicVacancy[]) {
      setVacancies(list);
      if (presetApplied.current) return;
      presetApplied.current = true;

      const search = window.location.search;
      const params = new URLSearchParams(search);
      const tracked = readSource(search);
      tracked.landing = `${window.location.pathname}${search}`.slice(0, 300);
      setSource(tracked);

      const campaign = getCampaignFromSearch(search);
      if (campaign) setPresetCampaign(campaign.trim());

      const vacancyId = matchVacancy(list, params.get("position") ?? params.get("vacancy"));
      if (!vacancyId) return;
      const picked = list.find((x) => x.id === vacancyId) ?? null;
      const branch = matchOption(
        branchChoices(
          picked,
          fallbackOffices.map((o) => ({ name: o.name })),
          vacancyId === GENERAL_APPLICATION
        ),
        params.get("branch")
      );
      setAnswers((current) => ({ ...current, vacancyId, branch }));
    }

    fetch("/api/offices?public=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.offices?.length) return;
        setOffices(
          data.offices.map((o: { name: string; address?: string | null }) => ({
            name: o.name,
            address: o.address,
          }))
        );
      })
      .catch(() => {});

    fetch("/api/vacancies?public=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        applyLink(Array.isArray(data?.vacancies) ? data.vacancies : fallbackVacancies);
      })
      .catch(() => {
        if (!cancelled) applyLink(fallbackVacancies);
      });

    fetchPublicCampaigns().then((items) => {
      if (cancelled) return;
      setCampaigns(
        items.map((c) => ({ title: c.title, locations: parseCampaignLocations(c.locations, c.location) }))
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Apply Now on a campaign card opens with that campaign's position chosen,
     plus its branch when it runs at only one, until the applicant picks. */
  const presetVacancy = useMemo(() => {
    if (!presetCampaign || !vacancies) return null;
    const key = presetCampaign.toLowerCase();
    const byTitle = vacancies.find((v) => v.title.trim().toLowerCase() === key);
    if (byTitle) return byTitle;
    /* A campaign hiring into several departments leaves the choice to the
       applicant; its departments are listed first instead. */
    const byCampaign = vacancies.filter((v) => v.campaign?.trim().toLowerCase() === key);
    return byCampaign.length === 1 ? byCampaign[0] : null;
  }, [presetCampaign, vacancies]);

  const positioned: ApplicationAnswers = useMemo(() => {
    if (!presetVacancy || rawAnswers.vacancyId) return rawAnswers;
    const branches = branchChoices(presetVacancy, offices, false);
    return {
      ...rawAnswers,
      vacancyId: presetVacancy.id,
      branch: rawAnswers.branch || (branches.length === 1 ? branches[0].value : ""),
    };
  }, [presetVacancy, rawAnswers, offices]);

  const vacancy = useMemo(
    () => vacancies?.find((v) => v.id === positioned.vacancyId) ?? null,
    [vacancies, positioned.vacancyId]
  );
  const general = positioned.vacancyId === GENERAL_APPLICATION;
  const branchOptions = useMemo(
    () => (positioned.vacancyId ? branchChoices(vacancy, offices, general) : []),
    [positioned.vacancyId, vacancy, offices, general]
  );
  const campaignOptions = useMemo(
    () => campaignChoices(campaigns, positioned.branch),
    [campaigns, positioned.branch]
  );

  /* The campaign from a campaign card or link fills the campaign question
     while the applicant has not chosen one themselves. */
  const campaignPreset =
    presetCampaign &&
    campaignOptions.find((c) => c.toLowerCase() === presetCampaign.toLowerCase());
  const answers: ApplicationAnswers =
    campaignPreset && !positioned.campaignInterest
      ? { ...positioned, campaignInterest: campaignPreset }
      : positioned;

  const ctx: ApplicationContext = {
    vacancy,
    offices,
    campaigns: campaignOptions,
    sourceKnown: hasKnownSource(source),
    cv: cvFile ? { name: cvFile.name, size: cvFile.size } : null,
  };
  const v = getVisibility(answers, ctx);

  function update(patch: Partial<ApplicationAnswers>) {
    setAnswers((current) => ({ ...current, ...patch }));
    if (Object.keys(errors).length > 0) {
      setErrors((current) => {
        const next = { ...current };
        for (const key of Object.keys(patch)) delete next[key as FieldKey];
        return next;
      });
    }
  }

  function chooseVacancy(vacancyId: string) {
    const picked = vacancies?.find((x) => x.id === vacancyId) ?? null;
    const choices = vacancyId ? branchChoices(picked, offices, vacancyId === GENERAL_APPLICATION) : [];
    update({
      vacancyId,
      branch: choices.some((c) => c.value === answers.branch) ? answers.branch : "",
    });
  }

  function chooseBranch(branch: string) {
    const nextCampaigns = campaignChoices(campaigns, branch);
    update({
      branch,
      campaignInterest:
        answers.campaignInterest === OPEN_CAMPAIGN || nextCampaigns.includes(answers.campaignInterest)
          ? answers.campaignInterest
          : "",
    });
  }

  function focusField(field: FieldKey) {
    window.setTimeout(() => {
      const el = document.getElementById(fid(field));
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 30);
  }

  function scrollToTop() {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Scroll + animate the success card once it replaces the form. */
  useEffect(() => {
    if (status !== "success") return;
    const el = sectionRef.current;
    if (!el) return;

    let cancelled = false;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 88);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });

    void loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      const card = el.querySelector(".join-us-form__success");
      if (!card || reduced) return;
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [status, referenceId]);

  function goToStep(next: number) {
    setStep(next);
    setStatus((s) => (s === "error" ? "idle" : s));
    scrollToTop();
  }

  function handleContinue() {
    const stepErrors = validateApplication(answers, ctx, step);
    const fields = Object.keys(stepErrors) as FieldKey[];
    if (fields.length > 0) {
      setErrors(stepErrors);
      focusField(fields[0]);
      return;
    }
    setErrors({});
    goToStep(step + 1);
  }

  function showErrors(all: Errors) {
    const fields = Object.keys(all) as FieldKey[];
    setErrors(all);
    const first = fields.reduce((best, f) => Math.min(best, stepOfField(f)), 2);
    setStep(first);
    focusField(fields.find((f) => stepOfField(f) === first) ?? fields[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      handleContinue();
      return;
    }
    if (submittingRef.current) return;

    const all = validateApplication(answers, ctx);
    if (Object.keys(all).length > 0) {
      showErrors(all);
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");
    setStatusMessage("");

    const payload = new FormData();
    payload.append("submissionKey", submissionKey.current);
    payload.append("answers", JSON.stringify(answers));
    payload.append("source", JSON.stringify(source));
    if (cvFile) payload.append("cv", cvFile);

    try {
      const res = await fetch("/api/applications", { method: "POST", body: payload });
      const data = await res.json().catch(() => ({}));

      if (res.ok && typeof data.referenceId === "string") {
        setReferenceId(data.referenceId);
        setStatus("success");
        submissionKey.current = newSubmissionKey();
        router.push(thankYouHref("application", data.referenceId));
        return;
      }

      if (res.status === 400 && data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setStatus("error");
        setStatusMessage(data.error || SUBMIT_ERROR);
        showErrors(data.fieldErrors as Errors);
        return;
      }

      setStatus("error");
      setStatusMessage(SUBMIT_ERROR);
    } catch {
      setStatus("error");
      setStatusMessage(SUBMIT_ERROR);
    } finally {
      submittingRef.current = false;
    }
  }

  /* Arriving from a campaign's Apply Now narrows the list to that campaign's
     positions (Medical Billing's departments, or the single campaign role).
     Opening the form directly, or choosing "Show all positions", lists all. */
  const presetPositions = useMemo(() => {
    if (!presetCampaign || !vacancies) return null;
    const key = presetCampaign.toLowerCase();
    const items = vacancies.filter(
      (v) =>
        isCampaignVacancyId(v.id) &&
        ((v.campaign ?? "").trim().toLowerCase() === key || v.title.trim().toLowerCase() === key)
    );
    if (!items.length) return null;
    return { label: items[0].campaign ?? items[0].title, items };
  }, [presetCampaign, vacancies]);

  const groupedVacancies = useMemo(() => {
    if (!vacancies) return [];
    if (presetPositions) return [{ ...presetPositions, bare: true }];
    const known = new Set(DEPARTMENTS.map((d) => d.value));
    const fromCampaigns = vacancies.filter((x) => isCampaignVacancyId(x.id));
    const published = vacancies.filter((x) => !isCampaignVacancyId(x.id));

    const byCampaign = new Map<string, PublicVacancy[]>();
    for (const item of fromCampaigns) {
      const name = item.campaign ?? item.title;
      byCampaign.set(name, [...(byCampaign.get(name) ?? []), item]);
    }
    const singles = fromCampaigns.filter((x) => byCampaign.get(x.campaign ?? x.title)?.length === 1);
    const preset = presetCampaign?.toLowerCase();
    const multi = [...byCampaign.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([name, items]) => ({ label: name, items, bare: true }));
    const presetFirst = multi.filter((g) => g.label.toLowerCase() === preset);
    const otherMulti = multi.filter((g) => g.label.toLowerCase() !== preset);

    const groups: { label: string; items: PublicVacancy[]; bare?: boolean }[] = [
      ...presetFirst,
      { label: CAMPAIGN_VACANCIES_LABEL, items: singles },
      ...otherMulti,
      ...DEPARTMENTS.map((d) => ({
        label: d.label,
        items: published.filter((x) => x.department === d.value),
      })),
    ];
    const others = published.filter((x) => !known.has(x.department));
    if (others.length) groups.push({ label: "Other vacancies", items: others });
    return groups.filter((g) => g.items.length > 0);
  }, [vacancies, presetCampaign, presetPositions]);

  const selectedBranchAddress =
    offices.find((o) => o.name === answers.branch)?.address?.trim() || null;

  const years = yearOptions();
  const [lastYear = "", lastMonth = ""] = answers.lastWorkedMonth.split("-");
  const setLastWorked = (year: string, month: string) =>
    update({ lastWorkedMonth: `${year}-${month}` });

  if (status === "success") {
    return (
      <section ref={sectionRef} id="apply" className="join-us-form-section section-with-net scroll-mt-24">
        <SectionAnimatedNet />
        <div className="join-us-form-section__inner">
          <div className="join-us-form join-us-form__success" role="status">
            <CheckCircle2 size={44} aria-hidden className="join-us-form__success-icon" />
            <h2 className="join-us-form__title">Application received</h2>
            <p className="join-us-form__success-text">
              Thank you for applying to Balitech. Your application has been received. Your reference
              number is <strong className="join-us-form__reference">{referenceId}</strong>. Our
              recruitment team will contact you if you are shortlisted.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const summary = step === 2 ? buildSummary(answers, ctx) : [];

  return (
    <section ref={sectionRef} id="apply" className="join-us-form-section section-with-net scroll-mt-24">
      <SectionAnimatedNet />

      <div className="join-us-form-section__inner">
        <form onSubmit={handleSubmit} noValidate className="join-us-form" aria-busy={status === "submitting"}>
          <header className="join-us-form__header">
            <h2 className="join-us-form__title">
              <HeadingLastWord text="Apply for a Role at Balitech" />
            </h2>
            <p className="join-us-form__subtitle">
              Tell us about yourself, the role you are interested in and your availability. Our
              recruitment team will review your application and contact shortlisted candidates about
              the next steps.
            </p>
            <p className="join-us-form__legend-note">
              Fields marked <span className="join-us-form__required">*</span> are required.
            </p>
          </header>

          <ol className="join-us-form__steps" aria-label="Application steps">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={`join-us-form__step${index === step ? " is-current" : ""}${index < step ? " is-done" : ""}${index > step ? " is-upcoming" : ""}`}
                aria-current={index === step ? "step" : undefined}
              >
                {index < step ? (
                  <button type="button" onClick={() => goToStep(index)} className="join-us-form__step-btn">
                    <span className="join-us-form__step-num">{index + 1}</span>
                    <span className="join-us-form__step-label">{label}</span>
                  </button>
                ) : (
                  <span className="join-us-form__step-btn" aria-disabled={index > step ? true : undefined}>
                    <span className="join-us-form__step-num">{index + 1}</span>
                    <span className="join-us-form__step-label">{label}</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="join-us-form__step-progress" aria-live="polite">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>

          {status === "error" && (
            <p className="join-us-form__status join-us-form__status--error" role="alert">
              {statusMessage || SUBMIT_ERROR}
            </p>
          )}

          {presetCampaign && step < 2 && (
            <div className="join-us-form__campaign">
              <p className="join-us-form__campaign-label">Applying for campaign</p>
              <p className="join-us-form__campaign-value">{presetCampaign}</p>
            </div>
          )}

          {step === 0 && (
            <div className="join-us-form__stack">
              <Field id={fid("fullName")} label="Full name" required error={errors.fullName}>
                <input
                  {...inputProps(fid("fullName"), errors.fullName)}
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  value={answers.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                  className="join-us-form__input"
                />
              </Field>

              <Field id={fid("mobile")} label="Mobile number" required error={errors.mobile}>
                <PhoneInput
                  id={fid("mobile")}
                  required
                  value={answers.mobile}
                  error={errors.mobile}
                  onChange={(mobile) => update({ mobile })}
                />
                <label className="join-us-form__check">
                  <input
                    type="checkbox"
                    checked={answers.whatsappSame}
                    onChange={(e) => update({ whatsappSame: e.target.checked })}
                  />
                  <span>This number is also on WhatsApp.</span>
                </label>
              </Field>

              {v.whatsapp && (
                <Field id={fid("whatsapp")} label="WhatsApp number" error={errors.whatsapp}>
                  <PhoneInput
                    id={fid("whatsapp")}
                    value={answers.whatsapp}
                    error={errors.whatsapp}
                    onChange={(whatsapp) => update({ whatsapp })}
                  />
                </Field>
              )}

              <Field
                id={fid("cnic")}
                label="CNIC number"
                required
                hint="Your 13-digit national identity card number."
                error={errors.cnic}
              >
                <input
                  {...inputProps(fid("cnic"), errors.cnic)}
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 35202-1234567-1"
                  maxLength={15}
                  value={answers.cnic}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d-]/g, "");
                    const digits = value.replace(/\D/g, "");
                    if (digits.length <= 13) {
                      if (digits.length > 5 && digits.length <= 12)
                        value = `${digits.slice(0, 5)}-${digits.slice(5)}`;
                      else if (digits.length > 12)
                        value = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
                    }
                    update({ cnic: value });
                  }}
                  className="join-us-form__input"
                />
              </Field>

              <Field
                id={fid("email")}
                label="Email"
                required
                hint="Use an email address you check regularly."
                error={errors.email}
              >
                <input
                  {...inputProps(fid("email"), errors.email, true)}
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  value={answers.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="join-us-form__input"
                />
              </Field>

              <Field id={fid("city")} label="Current city" required error={errors.city}>
                <input
                  {...inputProps(fid("city"), errors.city)}
                  type="text"
                  autoComplete="address-level2"
                  placeholder="e.g. Rawalpindi"
                  maxLength={80}
                  value={answers.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className="join-us-form__input"
                />
              </Field>

              <Field id={fid("qualification")} label="Highest completed qualification" error={errors.qualification}>
                <select
                  {...inputProps(fid("qualification"), errors.qualification)}
                  value={answers.qualification}
                  onChange={(e) => update({ qualification: e.target.value })}
                  className="join-us-form__select"
                >
                  <option value="">Select a qualification</option>
                  {QUALIFICATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <ChoiceGroup
                id={fid("employeeHistory")}
                legend="Have you worked for Balitech at any branch?"
                required
                options={EMPLOYEE_HISTORY_OPTIONS}
                value={answers.employeeHistory}
                error={errors.employeeHistory}
                onChange={(employeeHistory) => update({ employeeHistory })}
              />

              {v.employee && (
                <div className="join-us-form__conditional">
                  <Field id={fid("formerBranch")} label={QUESTIONS.formerBranch} required error={errors.formerBranch}>
                    <select
                      {...inputProps(fid("formerBranch"), errors.formerBranch)}
                      value={answers.formerBranch}
                      onChange={(e) => update({ formerBranch: e.target.value })}
                      className="join-us-form__select"
                    >
                      <option value="">Select a branch</option>
                      {offices.map((o) => (
                        <option key={o.name} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  {v.formerBranchOther && (
                    <Field id={fid("formerBranchOther")} label="Branch name" required error={errors.formerBranchOther}>
                      <input
                        {...inputProps(fid("formerBranchOther"), errors.formerBranchOther)}
                        type="text"
                        maxLength={120}
                        value={answers.formerBranchOther}
                        onChange={(e) => update({ formerBranchOther: e.target.value })}
                        className="join-us-form__input"
                      />
                    </Field>
                  )}
                  <Field id={fid("formerPosition")} label={QUESTIONS.formerPosition} required error={errors.formerPosition}>
                    <input
                      {...inputProps(fid("formerPosition"), errors.formerPosition)}
                      type="text"
                      maxLength={120}
                      value={answers.formerPosition}
                      onChange={(e) => update({ formerPosition: e.target.value })}
                      className="join-us-form__input"
                    />
                  </Field>
                  <Field id={fid("employeeId")} label="Employee ID" error={errors.employeeId}>
                    <input
                      {...inputProps(fid("employeeId"), errors.employeeId)}
                      type="text"
                      maxLength={40}
                      value={answers.employeeId}
                      onChange={(e) => update({ employeeId: e.target.value })}
                      className="join-us-form__input"
                    />
                  </Field>

                  {v.previous && (
                    <>
                      <fieldset
                        id={fid("lastWorkedMonth")}
                        tabIndex={-1}
                        className="join-us-form__fieldset"
                        aria-invalid={errors.lastWorkedMonth ? true : undefined}
                        aria-describedby={errors.lastWorkedMonth ? `${fid("lastWorkedMonth")}-error` : undefined}
                      >
                        <legend className="join-us-form__label">
                          {QUESTIONS.lastWorked}
                          <RequiredMark />
                        </legend>
                        <div className="join-us-form__grid join-us-form__grid--two join-us-form__grid--flush">
                          <select
                            aria-label="Month"
                            disabled={answers.lastWorkedUnknown}
                            value={lastMonth}
                            onChange={(e) => setLastWorked(lastYear, e.target.value)}
                            className="join-us-form__select"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m, i) => (
                              <option key={m} value={String(i + 1).padStart(2, "0")}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-label="Year"
                            disabled={answers.lastWorkedUnknown}
                            value={lastYear}
                            onChange={(e) => setLastWorked(e.target.value, lastMonth)}
                            className="join-us-form__select"
                          >
                            <option value="">Year</option>
                            {years.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="join-us-form__check">
                          <input
                            type="checkbox"
                            checked={answers.lastWorkedUnknown}
                            onChange={(e) =>
                              update({ lastWorkedUnknown: e.target.checked, lastWorkedMonth: e.target.checked ? "" : answers.lastWorkedMonth })
                            }
                          />
                          <span>I do not remember</span>
                        </label>
                        <FieldError id={fid("lastWorkedMonth")} error={errors.lastWorkedMonth} />
                      </fieldset>

                      <Field
                        id={fid("employmentEnd")}
                        label={QUESTIONS.employmentEnd}
                        required
                        error={errors.employmentEnd}
                      >
                        <select
                          {...inputProps(fid("employmentEnd"), errors.employmentEnd)}
                          value={answers.employmentEnd}
                          onChange={(e) => update({ employmentEnd: e.target.value })}
                          className="join-us-form__select"
                        >
                          <option value="">Select an option</option>
                          {EMPLOYMENT_END_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <CountedTextarea
                        id={fid("employmentEndNote")}
                        label="Explanation"
                        value={answers.employmentEndNote}
                        error={errors.employmentEndNote}
                        onChange={(employmentEndNote) => update({ employmentEndNote })}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="join-us-form__stack">
              <Field id={fid("vacancyId")} label="Position" required error={errors.vacancyId}>
                <select
                  {...inputProps(fid("vacancyId"), errors.vacancyId)}
                  value={answers.vacancyId}
                  disabled={!vacancies}
                  onChange={(e) => chooseVacancy(e.target.value)}
                  className="join-us-form__select"
                >
                  <option value="">
                    {!vacancies
                      ? "Loading positions..."
                      : presetPositions && presetPositions.items.length > 1
                        ? "Select a department"
                        : "Select a position"}
                  </option>
                  {groupedVacancies.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {!group.bare && item.campaign && item.campaign !== item.title
                            ? `${item.title} — ${item.campaign}`
                            : item.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>

              {presetPositions && (
                <button
                  type="button"
                  className="join-us-form__link"
                  onClick={() => {
                    setPresetCampaign(null);
                    update({ vacancyId: "", branch: "" });
                  }}
                >
                  Applying for something else? Show all positions
                </button>
              )}

              {vacancy?.description && !general && (
                <p className="join-us-form__vacancy-note">{vacancy.description}</p>
              )}

              <Field
                id={fid("branch")}
                label="Branch preference"
                required
                error={errors.branch}
                hint={!answers.vacancyId ? "Choose a position first." : undefined}
              >
                <select
                  {...inputProps(fid("branch"), errors.branch, !answers.vacancyId)}
                  value={answers.branch}
                  disabled={!answers.vacancyId}
                  onChange={(e) => chooseBranch(e.target.value)}
                  className="join-us-form__select"
                >
                  <option value="">Select a branch</option>
                  {branchOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {selectedBranchAddress && (
                  <p className="join-us-form__fixed-address join-us-form__branch-address">
                    <MapPin size={14} aria-hidden /> {selectedBranchAddress}
                  </p>
                )}
              </Field>

              <Field
                id={fid("experience")}
                label={experienceQuestion(general, vacancy)}
                required
                error={errors.experience}
              >
                <select
                  {...inputProps(fid("experience"), errors.experience)}
                  value={answers.experience}
                  onChange={(e) => update({ experience: e.target.value })}
                  className="join-us-form__select"
                >
                  <option value="">Select experience</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              {v.availabilityNote && (
                <CountedTextarea
                  id={fid("availabilityNote")}
                  label={QUESTIONS.availabilityNote}
                  required
                  value={answers.availabilityNote}
                  error={errors.availabilityNote}
                  onChange={(availabilityNote) => update({ availabilityNote })}
                />
              )}

              {v.heardAbout && (
                <Field id={fid("heardAbout")} label={QUESTIONS.heardAbout} required error={errors.heardAbout}>
                  <select
                    {...inputProps(fid("heardAbout"), errors.heardAbout)}
                    value={answers.heardAbout}
                    onChange={(e) => update({ heardAbout: e.target.value })}
                    className="join-us-form__select"
                  >
                    <option value="">Select an option</option>
                    {HEARD_ABOUT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field
                id={fid("joinTiming")}
                label="When are you available to join?"
                required
                error={errors.joinTiming}
              >
                <select
                  {...inputProps(fid("joinTiming"), errors.joinTiming)}
                  value={answers.joinTiming}
                  onChange={(e) => update({ joinTiming: e.target.value })}
                  className="join-us-form__select"
                >
                  <option value="">Select an option</option>
                  {JOIN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {v.earliestDate && (
                <Field id={fid("earliestDate")} label="Earliest available date" required error={errors.earliestDate}>
                  <input
                    {...inputProps(fid("earliestDate"), errors.earliestDate)}
                    type="date"
                    min={todayIso()}
                    value={answers.earliestDate}
                    onChange={(e) => update({ earliestDate: e.target.value })}
                    className="join-us-form__input"
                  />
                </Field>
              )}

              {v.campaignInterest && (
                <Field id={fid("campaignInterest")} label={QUESTIONS.campaignInterest} required error={errors.campaignInterest}>
                  <select
                    {...inputProps(fid("campaignInterest"), errors.campaignInterest)}
                    value={answers.campaignInterest}
                    onChange={(e) => update({ campaignInterest: e.target.value })}
                    className="join-us-form__select"
                  >
                    <option value="">Select a campaign</option>
                    {campaignOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value={OPEN_CAMPAIGN}>{OPEN_CAMPAIGN_LABEL}</option>
                  </select>
                </Field>
              )}
              {v.english && (
                <ChoiceGroup
                  id={fid("englishLevel")}
                  legend={QUESTIONS.englishLevel}
                  required
                  hint="This helps us plan your interview. It is not a final assessment."
                  options={ENGLISH_OPTIONS}
                  value={answers.englishLevel}
                  error={errors.englishLevel}
                  onChange={(englishLevel) => update({ englishLevel })}
                />
              )}
              {v.leadership && (
                <>
                  <Field id={fid("supervisedCount")} label={QUESTIONS.supervisedCount} required error={errors.supervisedCount}>
                    <input
                      {...inputProps(fid("supervisedCount"), errors.supervisedCount)}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={answers.supervisedCount}
                      onChange={(e) => update({ supervisedCount: e.target.value })}
                      className="join-us-form__input join-us-form__input--narrow"
                    />
                  </Field>
                  <CountedTextarea
                    id={fid("teamIssue")}
                    label={QUESTIONS.teamIssue}
                    required
                    value={answers.teamIssue}
                    error={errors.teamIssue}
                    onChange={(teamIssue) => update({ teamIssue })}
                  />
                </>
              )}
              {v.hr && (
                <MultiChoiceGroup
                  id={fid("hrTasks")}
                  legend={QUESTIONS.hrTasks}
                  required
                  options={HR_TASK_OPTIONS}
                  values={answers.hrTasks}
                  error={errors.hrTasks}
                  onChange={(hrTasks) => update({ hrTasks })}
                />
              )}
              {v.hrTasksOther && (
                <Field id={fid("hrTasksOther")} label="Other HR tasks" required error={errors.hrTasksOther}>
                  <input
                    {...inputProps(fid("hrTasksOther"), errors.hrTasksOther)}
                    type="text"
                    maxLength={120}
                    value={answers.hrTasksOther}
                    onChange={(e) => update({ hrTasksOther: e.target.value })}
                    className="join-us-form__input"
                  />
                </Field>
              )}
              {v.it && (
                <CountedTextarea
                  id={fid("itTools")}
                  label={QUESTIONS.itTools}
                  required
                  value={answers.itTools}
                  error={errors.itTools}
                  onChange={(itTools) => update({ itTools })}
                />
              )}
              {v.creative && (
                <>
                  <CountedTextarea
                    id={fid("creativeSkills")}
                    label={QUESTIONS.creativeSkills}
                    required
                    value={answers.creativeSkills}
                    error={errors.creativeSkills}
                    onChange={(creativeSkills) => update({ creativeSkills })}
                  />
                  <Field id={fid("portfolioUrl")} label={QUESTIONS.portfolioUrl} error={errors.portfolioUrl}>
                    <input
                      {...inputProps(fid("portfolioUrl"), errors.portfolioUrl)}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      maxLength={500}
                      value={answers.portfolioUrl}
                      onChange={(e) => update({ portfolioUrl: e.target.value })}
                      className="join-us-form__input"
                    />
                  </Field>
                </>
              )}
              {v.specialist && (
                <CountedTextarea
                  id={fid("specialistSkills")}
                  label={specialistQuestion(vacancy)}
                  required
                  value={answers.specialistSkills}
                  error={errors.specialistSkills}
                  onChange={(specialistSkills) => update({ specialistSkills })}
                />
              )}

              <div className="join-us-form__field">
                <span className="join-us-form__label">
                  CV
                  {v.cvRequired ? <RequiredMark /> : <span className="join-us-form__optional"> (optional)</span>}
                </span>
                <p className={`join-us-form__cv-rule${v.cvRequired ? " is-required" : ""}`}>
                  {describeCvRequirement(v.cvRequired)}
                </p>
                <input
                  ref={fileRef}
                  {...inputProps(fid("cv"), errors.cv)}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only join-us-form__file"
                  onChange={(e) => {
                    setCvFile(e.target.files?.[0] ?? null);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.cv;
                      return next;
                    });
                  }}
                />
                <div className="join-us-form__cv-row">
                  <label htmlFor={fid("cv")} className="join-us-form__btn join-us-form__btn--upload">
                    {cvFile ? "Replace CV" : "Upload CV"}
                  </label>
                  {cvFile && (
                    <>
                      <span className="join-us-form__cv-name">{cvFile.name}</span>
                      <button
                        type="button"
                        className="join-us-form__link"
                        onClick={() => {
                          setCvFile(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <FieldError id={fid("cv")} error={errors.cv} />
              </div>

              <CountedTextarea
                id={fid("anythingElse")}
                label="Is there anything else you would like us to know?"
                hint="You may mention a relevant skill, achievement or availability detail."
                value={answers.anythingElse}
                error={errors.anythingElse}
                onChange={(anythingElse) => update({ anythingElse })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="join-us-form__stack">
              {summary.map((section) => (
                <section key={section.title} className="join-us-form__review">
                  <div className="join-us-form__review-head">
                    <h3>{section.title}</h3>
                    <button type="button" className="join-us-form__link" onClick={() => goToStep(section.step)}>
                      <Pencil size={14} aria-hidden /> Edit
                    </button>
                  </div>
                  <dl>
                    {section.items.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}

              {v.heardAbout && (
                <>
                  {v.heardAboutOther && (
                    <Field id={fid("heardAboutOther")} label="Where did you hear about it?" error={errors.heardAboutOther}>
                      <input
                        {...inputProps(fid("heardAboutOther"), errors.heardAboutOther)}
                        type="text"
                        maxLength={120}
                        value={answers.heardAboutOther}
                        onChange={(e) => update({ heardAboutOther: e.target.value })}
                        className="join-us-form__input"
                      />
                    </Field>
                  )}
                  {v.referrerName && (
                    <Field id={fid("referrerName")} label={QUESTIONS.referrerName} error={errors.referrerName}>
                      <input
                        {...inputProps(fid("referrerName"), errors.referrerName)}
                        type="text"
                        maxLength={120}
                        value={answers.referrerName}
                        onChange={(e) => update({ referrerName: e.target.value })}
                        className="join-us-form__input"
                      />
                    </Field>
                  )}
                </>
              )}

              <div className="join-us-form__consents">
                <label className="join-us-form__check join-us-form__check--consent">
                  <input
                    {...inputProps(fid("confirmAccurate"), errors.confirmAccurate)}
                    type="checkbox"
                    checked={answers.confirmAccurate}
                    onChange={(e) => update({ confirmAccurate: e.target.checked })}
                  />
                  <span>
                    I confirm that the information I have provided is accurate.
                    <RequiredMark />
                  </span>
                </label>
                <FieldError id={fid("confirmAccurate")} error={errors.confirmAccurate} />

                <label className="join-us-form__check join-us-form__check--consent">
                  <input
                    {...inputProps(fid("consentRecruitment"), errors.consentRecruitment)}
                    type="checkbox"
                    checked={answers.consentRecruitment}
                    onChange={(e) => update({ consentRecruitment: e.target.checked })}
                  />
                  <span>
                    I agree that Balitech may use my application for recruitment, share it with the
                    relevant recruitment teams across its branches, and contact me about this
                    application as described in the{" "}
                    <a href={RECRUITMENT_PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                      Privacy Notice
                    </a>
                    .
                    <RequiredMark />
                  </span>
                </label>
                <FieldError id={fid("consentRecruitment")} error={errors.consentRecruitment} />

                <label className="join-us-form__check join-us-form__check--consent">
                  <input
                    type="checkbox"
                    checked={answers.futureOpenings}
                    onChange={(e) => update({ futureOpenings: e.target.checked })}
                  />
                  <span>I would also like to be considered for future suitable openings.</span>
                </label>
              </div>
            </div>
          )}

          <div className="join-us-form__nav">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                disabled={status === "submitting"}
                className="join-us-form__btn join-us-form__btn--ghost"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="submit" className="join-us-form__btn join-us-form__btn--submit">
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={status === "submitting"}
                className="join-us-form__btn join-us-form__btn--submit"
              >
                {status === "submitting" ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
