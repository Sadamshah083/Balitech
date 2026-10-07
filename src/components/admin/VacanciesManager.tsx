"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-token";
import { campaignLocations } from "@/lib/campaign-locations";
import {
  DEPARTMENTS,
  ROLE_GROUPS,
  WORK_ARRANGEMENTS,
  departmentLabel,
  findCatalogPosition,
  type RoleGroup,
} from "@/lib/careers/catalog";
import { CAREER_CATEGORIES } from "@/lib/careers/career-board";
import { slugifyVacancyTitle } from "@/lib/careers/vacancies";
import type { PublicVacancy } from "@/lib/careers/application";
import AdminModal from "./AdminModal";
import ConfirmDialog from "./ConfirmDialog";

/** Friendlier category labels for the career board (operations → Sales & Marketing). */
function categorySelectLabel(value: string) {
  return CAREER_CATEGORIES.find((c) => c.value === value)?.label ?? departmentLabel(value);
}

type Vacancy = PublicVacancy & { order: number; isActive: boolean };

type FormState = {
  title: string;
  slug: string;
  department: string;
  roleGroups: RoleGroup[];
  branches: string[];
  remoteAllowed: boolean;
  campaign: string;
  workingDays: string;
  workingHours: string;
  workArrangement: string;
  cvRequired: boolean;
  customQuestion: string;
  description: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  department: "operations",
  roleGroups: [],
  branches: [],
  remoteAllowed: false,
  campaign: "",
  workingDays: "Monday–Friday",
  workingHours: "6:00 PM – 4:00 AM",
  workArrangement: "On-site",
  cvRequired: false,
  customQuestion: "",
  description: "",
  order: 0,
  isActive: true,
};

type RolePreset = {
  role: string;
  groups: RoleGroup[];
  cv: boolean;
  department: string;
  /** Campaign floor seats need a campaign before Fill form. */
  needsCampaign: boolean;
  group: "Campaign floor" | "Operations" | "Dialer & IT" | "HR" | "QA" | "Development";
};

/** Quick-start roles shown in the Role dropdown (grouped). */
const ROLE_PRESETS: RolePreset[] = [
  {
    role: "Verifier",
    groups: ["campaign", "english"],
    cv: false,
    department: "operations",
    needsCampaign: true,
    group: "Campaign floor",
  },
  {
    role: "Self Verifier",
    groups: ["campaign", "english"],
    cv: false,
    department: "operations",
    needsCampaign: true,
    group: "Campaign floor",
  },
  {
    role: "Closer",
    groups: ["campaign", "english"],
    cv: false,
    department: "operations",
    needsCampaign: true,
    group: "Campaign floor",
  },
  {
    role: "Team Lead",
    groups: ["leadership", "campaign", "english"],
    cv: true,
    department: "operations",
    needsCampaign: true,
    group: "Operations",
  },
  {
    role: "Floor Manager",
    groups: ["leadership", "english"],
    cv: true,
    department: "operations",
    needsCampaign: false,
    group: "Operations",
  },
  {
    role: "Operations Manager",
    groups: ["leadership", "english"],
    cv: true,
    department: "operations",
    needsCampaign: false,
    group: "Operations",
  },
  {
    role: "Project Manager",
    groups: ["leadership", "english"],
    cv: true,
    department: "operations",
    needsCampaign: false,
    group: "Operations",
  },
  {
    role: "Dialer Executive",
    groups: ["it", "english"],
    cv: false,
    department: "it",
    needsCampaign: false,
    group: "Dialer & IT",
  },
  {
    role: "Dialer Manager",
    groups: ["it", "leadership", "english"],
    cv: true,
    department: "it",
    needsCampaign: false,
    group: "Dialer & IT",
  },
  {
    role: "IT Support",
    groups: ["it"],
    cv: false,
    department: "it",
    needsCampaign: false,
    group: "Dialer & IT",
  },
  {
    role: "HR Executive",
    groups: ["hr"],
    cv: false,
    department: "hr",
    needsCampaign: false,
    group: "HR",
  },
  {
    role: "HR Manager",
    groups: ["hr", "leadership"],
    cv: true,
    department: "hr",
    needsCampaign: false,
    group: "HR",
  },
  {
    role: "HR Recruiter",
    groups: ["hr"],
    cv: false,
    department: "hr",
    needsCampaign: false,
    group: "HR",
  },
  {
    role: "HR Receptionist",
    groups: ["hr", "specialist"],
    cv: false,
    department: "hr",
    needsCampaign: false,
    group: "HR",
  },
  {
    role: "QA Executive",
    groups: ["specialist", "english"],
    cv: false,
    department: "quality",
    needsCampaign: false,
    group: "QA",
  },
  {
    role: "QA Manager",
    groups: ["leadership", "specialist", "english"],
    cv: true,
    department: "quality",
    needsCampaign: false,
    group: "QA",
  },
  {
    role: "Web Developer",
    groups: ["creative"],
    cv: true,
    department: "development",
    needsCampaign: false,
    group: "Development",
  },
];

const ROLE_PRESET_GROUPS = [
  "Campaign floor",
  "Operations",
  "Dialer & IT",
  "HR",
  "QA",
  "Development",
] as const;

async function readError(res: Response, fallback: string) {
  if (res.status === 401) {
    return "Your admin session has expired. Reload the page and sign in again.";
  }
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error) return data.error;
  } catch {
    /* not JSON */
  }
  return `${fallback} (HTTP ${res.status})`;
}

export default function VacanciesManager({
  initialData,
}: {
  initialData?: {
    vacancies: Vacancy[];
    branches: string[];
    campaigns: string[];
  };
}) {
  const [vacancies, setVacancies] = useState<Vacancy[]>(initialData?.vacancies ?? []);
  const [branches, setBranches] = useState<string[]>(initialData?.branches ?? [...campaignLocations]);
  const [campaigns, setCampaigns] = useState<string[]>(initialData?.campaigns ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [listError, setListError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Vacancy | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templateCampaign, setTemplateCampaign] = useState("");
  const [templateRole, setTemplateRole] = useState<string>(ROLE_PRESETS[0].role);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const fieldId = useId();

  async function fetchVacancies() {
    try {
      const res = await adminFetch("/api/vacancies");
      if (!res.ok) {
        setListError(await readError(res, "Could not load vacancies"));
        return;
      }
      const data = await res.json();
      setVacancies(data.vacancies);
      setListError(null);
    } catch {
      setListError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialData) return;
    const handle = setTimeout(() => {
      fetchVacancies();
      fetch("/api/offices?public=true")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.offices?.length) setBranches(data.offices.map((o: { name: string }) => o.name));
        })
        .catch(() => {});
      fetch("/api/campaigns?public=true")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.campaigns)) {
            setCampaigns(data.campaigns.map((c: { title: string }) => c.title));
          }
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    const nextOrder = vacancies.reduce((highest, v) => Math.max(highest, v.order), 0) + 1;
    setEditingId(null);
    setForm({ ...emptyForm, branches: [], order: nextOrder });
    setFormError(null);
    setShowAdvanced(false);
    setSlugTouched(false);
    setShowForm(true);
  }

  function openEdit(vacancy: Vacancy) {
    setEditingId(vacancy.id);
    setForm({
      title: vacancy.title,
      slug: vacancy.slug ?? "",
      department: vacancy.department,
      roleGroups: vacancy.roleGroups,
      branches: vacancy.branches,
      remoteAllowed: vacancy.remoteAllowed,
      campaign: vacancy.campaign ?? "",
      workingDays: vacancy.workingDays ?? "",
      workingHours: vacancy.workingHours ?? "",
      workArrangement: vacancy.workArrangement ?? "",
      cvRequired: vacancy.cvRequired,
      customQuestion: vacancy.customQuestion ?? "",
      description: vacancy.description ?? "",
      order: vacancy.order,
      isActive: vacancy.isActive,
    });
    setFormError(null);
    setShowAdvanced(false);
    setSlugTouched(true);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowAdvanced(false);
    setSlugTouched(false);
  }

  /* Picking a known position fills in its usual department, question groups
     and CV rule, which HR can then adjust. Only on new vacancies, so editing
     a title never silently rewrites settings someone chose. */
  function changeTitle(title: string) {
    const known = editingId ? null : findCatalogPosition(title);
    setForm((current) => {
      const nextSlug =
        !slugTouched || !current.slug
          ? slugifyVacancyTitle(title)
          : current.slug;
      return known
        ? {
            ...current,
            title,
            slug: nextSlug,
            department: known.department,
            roleGroups: known.groups,
            cvRequired: Boolean(known.cvRequired),
          }
        : { ...current, title, slug: nextSlug };
    });
  }

  function selectAllBranches() {
    setForm((current) => ({ ...current, branches: [...branches] }));
  }

  function clearBranches() {
    setForm((current) => ({ ...current, branches: [] }));
  }

  function defaultJdForPreset(preset: RolePreset, campaign: string) {
    const scope = campaign ? ` for the ${campaign} campaign` : " at BALITECH";
    const heading = campaign ? `${preset.role} — ${campaign}` : preset.role;

    if (preset.department === "it" && /dialer/i.test(preset.role)) {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring a ${preset.role} to support${campaign ? ` the ${campaign} campaign` : ""} dialer, CRM, and telephony across live US-shift operations.`,
        "",
        "Key responsibilities",
        "• Configure and monitor dialer campaigns, lists, and dispositions",
        "• Troubleshoot agent connectivity, headset, and dialer issues on the floor",
        "• Coordinate with IT, floor leads, and campaign managers on go-lives and changes",
        "• Maintain uptime, call quality, and basic reporting for assigned campaigns",
        "",
        "Requirements",
        "• Hands-on dialer / telephony experience (Vicidial or similar preferred)",
        "• Comfortable supporting a live call-center floor under pressure",
        "• Clear communication with agents and leadership",
        "• Able to work on-site at the selected BALITECH branch on US-aligned hours",
        "",
        "What we offer",
        "• Competitive package based on experience",
        "• Exposure to multi-campaign dialer operations",
        "• Growth path into Dialer Administrator / IT leadership",
      ].join("\n");
    }

    if (preset.department === "it") {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring an ${preset.role}${scope} to keep systems, networks, and floor tech running smoothly.`,
        "",
        "Key responsibilities",
        "• Support agents and staff with hardware, network, and software issues",
        "• Maintain office IT assets and escalate vendor tickets when needed",
        "• Assist with onboarding setups and day-to-day tech requests",
        "• Coordinate with dialer and operations teams during incidents",
        "",
        "Requirements",
        "• Practical IT support experience in an office or BPO environment",
        "• Clear communication and calm troubleshooting under pressure",
        "• Able to work on-site at the selected BALITECH branch",
        "",
        "What we offer",
        "• Competitive package based on experience",
        "• Hands-on exposure across a multi-office call-center stack",
      ].join("\n");
    }

    if (preset.department === "hr") {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring a ${preset.role}${scope} to support recruitment, people operations, and candidate experience.`,
        "",
        "Key responsibilities",
        "• Handle hiring workflows, candidate coordination, and HR desk requests",
        "• Maintain accurate records and follow BALITECH HR processes",
        "• Coordinate interviews and onboarding with hiring managers",
        "• Represent BALITECH professionally with candidates and staff",
        "",
        "Requirements",
        "• HR, recruitment, or front-desk experience preferred",
        "• Strong organization and communication skills",
        "• Comfortable with a busy call-center hiring volume",
        "",
        "What we offer",
        "• Competitive package based on experience",
        "• Growth path within HR and people operations",
      ].join("\n");
    }

    if (preset.department === "quality") {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring a ${preset.role}${scope} to protect call quality, coaching standards, and compliance.`,
        "",
        "Key responsibilities",
        "• Monitor and score calls against campaign and quality standards",
        "• Share coaching feedback with agents and team leads",
        "• Escalate compliance or process risks promptly",
        "• Support calibration sessions and quality reporting",
        "",
        "Requirements",
        "• Prior QA or campaign floor experience preferred",
        "• Strong English listening and written feedback skills",
        "• Detail-oriented and comfortable with US-aligned hours",
        "",
        "What we offer",
        "• Competitive package based on experience",
        "• Path into QA leadership and training roles",
      ].join("\n");
    }

    if (preset.department === "development") {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring a ${preset.role} to build and maintain BALITECH web products and internal tools.`,
        "",
        "Key responsibilities",
        "• Develop and maintain website and web application features",
        "• Collaborate with stakeholders on requirements and delivery",
        "• Write clean, maintainable code and fix production issues",
        "• Improve performance, SEO, and reliability where needed",
        "",
        "Requirements",
        "• Proven web development experience (React / Next.js preferred)",
        "• Strong problem-solving and communication skills",
        "• Portfolio or GitHub samples preferred",
        "",
        "What we offer",
        "• Competitive package based on experience",
        "• Ownership of real production systems used company-wide",
      ].join("\n");
    }

    if (preset.needsCampaign && campaign) {
      return [
        heading,
        "",
        "Role overview",
        `We are hiring a ${preset.role} for the ${campaign} campaign. You will work on a live US-shift floor with supervisor support, coaching, and clear performance targets.`,
        "",
        "Key responsibilities",
        `• Deliver ${preset.role.toLowerCase()} work to campaign and compliance standards`,
        "• Follow approved scripts, processes, and documentation requirements",
        "• Meet quality and productivity targets with coaching from your team lead",
        "• Coordinate with verifiers, closers, QA, and floor leadership as needed",
        "",
        "Requirements",
        "• Relevant campaign or BPO experience preferred",
        "• Clear spoken English and professional phone presence",
        "• Comfortable with Monday–Friday US-aligned evening/night hours",
        "• Able to work on-site at the selected BALITECH branch",
        "",
        "What we offer",
        "• Competitive pay tied to performance",
        "• Campaign-specific training and floor coaching",
        "• Growth path into leadership for strong performers",
      ].join("\n");
    }

    return [
      heading,
      "",
      "Role overview",
      `${preset.role} at BALITECH with ownership of team performance, floor standards, and day-to-day operations.`,
      "",
      "Key responsibilities",
      "• Lead and coach the assigned team or function",
      "• Own quality, productivity, and escalation handling",
      "• Report progress to operations leadership",
      "• Maintain compliance and process standards on the floor",
      "",
      "Requirements",
      "• Prior leadership or specialist experience in a BPO / call center",
      "• Strong communication and people-management skills",
      "• Comfortable with US-aligned operating hours",
      "",
      "What we offer",
      "• Leadership track with clear ownership",
      "• Competitive package based on experience",
    ].join("\n");
  }

  function applyRoleTemplate() {
    const preset = ROLE_PRESETS.find((p) => p.role === templateRole) ?? ROLE_PRESETS[0];
    const campaign = templateCampaign.trim();

    if (preset.needsCampaign && !campaign) {
      setFormError("Choose a campaign first (e.g. ACA, Medicare), then apply this role.");
      return;
    }

    const title = campaign
      ? preset.department === "it" || !preset.needsCampaign
        ? `${preset.role} — ${campaign}`
        : `${campaign} — ${preset.role}`
      : preset.role;

    setForm((current) => ({
      ...current,
      title,
      slug: slugifyVacancyTitle(title),
      department: preset.department,
      roleGroups: [...preset.groups],
      campaign: campaign || (preset.needsCampaign ? campaign : ""),
      cvRequired: preset.cv,
      workArrangement: current.workArrangement || "On-site",
      workingDays: current.workingDays || "Monday–Friday",
      workingHours: current.workingHours || "6:00 PM – 4:00 AM",
      description: current.description.trim() || defaultJdForPreset(preset, campaign),
    }));
    setSlugTouched(false);
    setFormError(null);
  }

  function toggle<T extends string>(list: T[], value: T, checked: boolean, order: readonly T[]) {
    return order.filter((item) => (item === value ? checked : list.includes(item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!form.title.trim()) {
      setFormError("Job title is required.");
      return;
    }
    if (form.branches.length === 0 && !form.remoteAllowed) {
      setFormError("Select at least one branch, or tick Remote allowed.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Add a job description — candidates see this on the career page.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await adminFetch(editingId ? `/api/vacancies/${editingId}` : "/api/vacancies", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setFormError(await readError(res, editingId ? "Could not save changes" : "Could not create vacancy"));
        return;
      }
      await fetchVacancies();
      closeForm();
    } catch {
      setFormError("Could not reach the server. Your changes were not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(vacancy: Vacancy) {
    const res = await adminFetch(`/api/vacancies/${vacancy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !vacancy.isActive }),
    });
    if (res.ok) {
      await fetchVacancies();
    } else {
      setListError(await readError(res, "Could not update vacancy"));
    }
  }

  async function handleDelete() {
    const target = pendingDelete;
    if (!target || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminFetch(`/api/vacancies/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError(await readError(res, "Could not delete vacancy"));
        return;
      }
      await fetchVacancies();
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not reach the server. Nothing was deleted.");
    } finally {
      setDeleting(false);
    }
  }

  async function copyLink(vacancy: Vacancy) {
    const url = new URL("/join-us", window.location.origin);
    url.searchParams.set("position", vacancy.slug || vacancy.id);
    if (vacancy.branches.length === 1) url.searchParams.set("branch", vacancy.branches[0]);
    if (vacancy.campaign) url.searchParams.set("campaign", vacancy.campaign);
    url.hash = "apply";
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedId(vacancy.id);
      setTimeout(() => setCopiedId((id) => (id === vacancy.id ? null : id)), 2000);
    } catch {
      window.prompt("Copy this application link:", url.toString());
    }
  }

  const positionSuggestions = DEPARTMENTS.find((d) => d.value === form.department)?.positions ?? [];

  if (loading) {
    return <p className="text-muted">Loading vacancies...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vacancies</h2>
          <p className="text-sm text-muted">
            Active vacancies appear on the public{" "}
            <a href="/career" className="font-semibold text-orange underline-offset-2 hover:underline">
              /career
            </a>{" "}
            board and in the Join Us application form. Hide a vacancy as soon as it stops accepting
            applications.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} aria-hidden="true" />
          Add Vacancy
        </button>
      </div>

      {listError && (
        <p className="admin-modal__error mb-6" role="alert">
          {listError}
        </p>
      )}

      {vacancies.length === 0 && (
        <p className="mb-6 rounded-lg border border-orange/30 bg-orange/10 p-4 text-sm text-foreground">
          No vacancies yet, so the careers form only lists active campaign openings until you add a vacancy here.
          Once you add a vacancy, only the vacancies listed here are offered.
        </p>
      )}

      <AdminModal
        open={showForm}
        title={editingId ? "Edit vacancy" : "Add vacancy"}
        description="Fill the basics below. Use Quick start to pick a role and auto-fill the form."
        onClose={closeForm}
        dismissible={!saving}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="admin-modal__btn admin-modal__btn--ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={`${fieldId}-form`}
              disabled={saving}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Publish vacancy"}
            </button>
          </>
        }
      >
        <form id={`${fieldId}-form`} onSubmit={handleSubmit} className="space-y-6">
          {!editingId && (
            <section className="rounded-xl border border-orange/25 bg-orange/5 p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground">1. Quick start (optional)</p>
                <p className="mt-1 text-xs text-muted">
                  Pick a role to auto-fill title, category, and job description. Campaign is required
                  for Verifier / Closer / Team Lead; optional for HR, QA, Dialer, and other roles.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label htmlFor={`${fieldId}-tpl-role`} className="mb-1 block text-xs font-semibold text-muted">
                    Role
                  </label>
                  <select
                    id={`${fieldId}-tpl-role`}
                    value={templateRole}
                    onChange={(e) => setTemplateRole(e.target.value)}
                    className="brand-input w-full"
                  >
                    {ROLE_PRESET_GROUPS.map((group) => (
                      <optgroup key={group} label={group}>
                        {ROLE_PRESETS.filter((p) => p.group === group).map((p) => (
                          <option key={p.role} value={p.role}>
                            {p.role}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${fieldId}-tpl-campaign`} className="mb-1 block text-xs font-semibold text-muted">
                    Campaign
                  </label>
                  <select
                    id={`${fieldId}-tpl-campaign`}
                    value={templateCampaign}
                    onChange={(e) => setTemplateCampaign(e.target.value)}
                    className="brand-input w-full"
                  >
                    <option value="">
                      {(ROLE_PRESETS.find((p) => p.role === templateRole) ?? ROLE_PRESETS[0])
                        .needsCampaign
                        ? "Select campaign… *"
                        : "Optional — none"}
                    </option>
                    {campaigns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyRoleTemplate}
                    className="btn-primary w-full rounded-lg px-4 py-2 text-sm font-semibold sm:w-auto"
                  >
                    Fill form
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <p className="text-sm font-bold text-foreground">
              {editingId ? "Role details" : "2. Role details"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={`${fieldId}-title`} className="brand-label mb-2 block">
                  Job title *
                </label>
                <input
                  id={`${fieldId}-title`}
                  type="text"
                  required
                  list={`${fieldId}-positions`}
                  placeholder="e.g. FE Closer — Final Expense"
                  value={form.title}
                  onChange={(e) => changeTitle(e.target.value)}
                  className="brand-input w-full"
                />
                <datalist id={`${fieldId}-positions`}>
                  {positionSuggestions.map((p) => (
                    <option key={p.title} value={p.title} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor={`${fieldId}-department`} className="brand-label mb-2 block">
                  Category *
                </label>
                <select
                  id={`${fieldId}-department`}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="brand-input w-full"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {categorySelectLabel(d.value)}
                    </option>
                  ))}
                </select>
                <p className="admin-branch-picker__hint">
                  Shown as a filter on /career (Sales &amp; Marketing = campaign floors).
                </p>
              </div>
              <div>
                <label htmlFor={`${fieldId}-campaign`} className="brand-label mb-2 block">
                  Campaign
                </label>
                <select
                  id={`${fieldId}-campaign`}
                  value={form.campaign}
                  onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                  className="brand-input w-full"
                >
                  <option value="">None (management / general)</option>
                  {[...new Set([...campaigns, ...(form.campaign ? [form.campaign] : [])])].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
                <p className="admin-branch-picker__hint">
                  Badge on the career card (ACA, Medicare, Final Expense, etc.).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">
                {editingId ? "Branches *" : "3. Branches *"}
              </p>
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={selectAllBranches}
                  className="text-orange underline-offset-2 hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearBranches}
                  className="text-muted underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="admin-branch-picker">
              {branches.map((branch) => {
                const checked = form.branches.includes(branch);
                return (
                  <label
                    key={branch}
                    className={`admin-branch-picker__option${checked ? " is-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          branches: toggle(form.branches, branch, e.target.checked, branches),
                        })
                      }
                      className="accent-orange"
                    />
                    {branch}
                  </label>
                );
              })}
              <label
                className={`admin-branch-picker__option${form.remoteAllowed ? " is-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={form.remoteAllowed}
                  onChange={(e) => setForm({ ...form, remoteAllowed: e.target.checked })}
                  className="accent-orange"
                />
                Remote allowed
              </label>
            </div>
            <p className="admin-branch-picker__hint">
              Tick every office hiring for this role (e.g. only Islamabad Office for I-9).
            </p>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-bold text-foreground">
              {editingId ? "Schedule" : "4. Schedule"}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor={`${fieldId}-days`} className="brand-label mb-2 block">
                  Working days
                </label>
                <input
                  id={`${fieldId}-days`}
                  type="text"
                  placeholder="Monday–Friday"
                  value={form.workingDays}
                  onChange={(e) => setForm({ ...form, workingDays: e.target.value })}
                  className="brand-input w-full"
                />
              </div>
              <div>
                <label htmlFor={`${fieldId}-hours`} className="brand-label mb-2 block">
                  Hours
                </label>
                <input
                  id={`${fieldId}-hours`}
                  type="text"
                  placeholder="6:00 PM – 4:00 AM"
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                  className="brand-input w-full"
                />
              </div>
              <div>
                <label htmlFor={`${fieldId}-arrangement`} className="brand-label mb-2 block">
                  Work type
                </label>
                <select
                  id={`${fieldId}-arrangement`}
                  value={form.workArrangement}
                  onChange={(e) => setForm({ ...form, workArrangement: e.target.value })}
                  className="brand-input w-full"
                >
                  <option value="">Not stated</option>
                  {WORK_ARRANGEMENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-bold text-foreground">
              {editingId ? "Job description" : "5. Job description"}
            </p>
            <div>
              <label htmlFor={`${fieldId}-description`} className="brand-label mb-2 block">
                Full description (shown on /career job page) *
              </label>
              <textarea
                id={`${fieldId}-description`}
                rows={10}
                maxLength={10000}
                required
                placeholder={
                  "Role overview\n…\n\nKey responsibilities\n• …\n\nRequirements\n• …\n\nWhat we offer\n• …"
                }
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="brand-input w-full font-sans text-sm leading-relaxed"
              />
              <p className="admin-branch-picker__hint">
                Use headings and bullet lines (•). Candidates see this when they open the role.
                {form.description.length > 0
                  ? ` ${form.description.length.toLocaleString()} / 10,000 characters.`
                  : ""}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-foreground/10 bg-surface/40 px-3 py-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="accent-orange"
              />
              <span>
                <strong className="font-bold">Publish now</strong>
                <span className="block text-xs text-muted">
                  Listed on /career and available in the Join Us application form
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-foreground/10">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold text-foreground"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
            >
              More options
              <ChevronDown
                size={16}
                className={`shrink-0 transition ${showAdvanced ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {showAdvanced && (
              <div className="space-y-4 border-t border-foreground/10 px-4 py-4">
                <div>
                  <label htmlFor={`${fieldId}-slug`} className="brand-label mb-2 block">
                    URL slug
                  </label>
                  <input
                    id={`${fieldId}-slug`}
                    type="text"
                    placeholder="auto from title"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm({ ...form, slug: e.target.value });
                    }}
                    className="brand-input w-full font-mono text-sm"
                  />
                  <p className="admin-branch-picker__hint">
                    Public page: /career/{form.slug || slugifyVacancyTitle(form.title || "role")}
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.cvRequired}
                    onChange={(e) => setForm({ ...form, cvRequired: e.target.checked })}
                    className="accent-orange"
                  />
                  CV required on the application form
                </label>

                <div>
                  <label htmlFor={`${fieldId}-question`} className="brand-label mb-2 block">
                    Extra application question
                  </label>
                  <input
                    id={`${fieldId}-question`}
                    type="text"
                    maxLength={300}
                    placeholder="e.g. How many months of Final Expense closer experience do you have?"
                    value={form.customQuestion}
                    onChange={(e) => setForm({ ...form, customQuestion: e.target.value })}
                    className="brand-input w-full"
                  />
                </div>

                <fieldset>
                  <legend className="brand-label mb-2 block">Application question groups</legend>
                  <div className="admin-branch-picker">
                    {ROLE_GROUPS.map((group) => {
                      const checked = form.roleGroups.includes(group.value);
                      return (
                        <label
                          key={group.value}
                          className={`admin-branch-picker__option${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                roleGroups: toggle(
                                  form.roleGroups,
                                  group.value,
                                  e.target.checked,
                                  ROLE_GROUPS.map((g) => g.value)
                                ),
                              })
                            }
                            className="accent-orange"
                          />
                          {group.label}
                        </label>
                      );
                    })}
                  </div>
                  <p className="admin-branch-picker__hint">
                    Controls which Join Us form questions appear. Templates set this for you.
                  </p>
                </fieldset>

                <div>
                  <label htmlFor={`${fieldId}-order`} className="brand-label mb-2 block">
                    Sort order
                  </label>
                  <input
                    id={`${fieldId}-order`}
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="brand-input w-full max-w-40"
                  />
                  <p className="admin-branch-picker__hint">Lower numbers appear first on /career.</p>
                </div>
              </div>
            )}
          </section>

          {formError && (
            <p className="admin-modal__error" role="alert">
              {formError}
            </p>
          )}
        </form>
      </AdminModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete vacancy"
        message={`Delete "${pendingDelete?.title ?? ""}"? Existing applications are kept. This cannot be undone.`}
        pending={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />

      {vacancies.length > 0 && (
        <div className="admin-surface border border-foreground/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="bg-card text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Branches</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">CV</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacancies.map((vacancy) => {
                  const where = [...vacancy.branches, ...(vacancy.remoteAllowed ? ["Remote"] : [])].join(", ");
                  return (
                    <tr
                      key={vacancy.id}
                      className={`border-t border-foreground/8 hover:bg-surface ${!vacancy.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {vacancy.title}
                        {vacancy.campaign && (
                          <span className="block text-xs font-normal text-muted">{vacancy.campaign}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {categorySelectLabel(vacancy.department)}
                      </td>
                      <td className="max-w-55 truncate px-4 py-3 text-muted" title={where}>
                        {where || "—"}
                      </td>
                      <td className="max-w-50 truncate px-4 py-3 text-muted">
                        {[vacancy.workingDays, vacancy.workingHours].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{vacancy.cvRequired ? "Required" : "Optional"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(vacancy)}
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${
                            vacancy.isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                          }`}
                          title={vacancy.isActive ? "Click to stop accepting applications" : "Click to list on the form"}
                        >
                          {vacancy.isActive ? "Accepting" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyLink(vacancy)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Copy application link for ${vacancy.title}`}
                            title={copiedId === vacancy.id ? "Copied" : "Copy application link"}
                          >
                            <Link2 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(vacancy)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Edit ${vacancy.title}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(vacancy);
                            }}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                            aria-label={`Delete ${vacancy.title}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
