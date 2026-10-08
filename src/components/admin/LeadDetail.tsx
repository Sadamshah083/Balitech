"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-token";
import type { SummarySection } from "@/lib/careers/application";
import { FLAG_LABELS, parseFlags, queueLabel } from "@/lib/careers/review";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  message: string | null;
  cvFileName: string | null;
  cvPath: string | null;
  status: string;
  createdAt: string;
  referenceId?: string | null;
  queue?: string | null;
  flags?: string | null;
  details?: string | null;
  source?: string | null;
};

type ApplicationDetails = {
  summary?: SummarySection[];
  answers?: Record<string, unknown>;
  duplicates?: { id: string; referenceId: string | null; position: string | null; createdAt: string }[];
};

/* Applications saved before these questions were removed still hold their
   answers, so the detail page drops those rows rather than rewriting the record. */
const RETIRED_SUMMARY_LABELS = new Set([
  "Most recent relevant role",
  "Can work this schedule",
  "Expected monthly basic salary",
  "Which campaigns have you worked on?",
]);

function currentSummary(sections: SummarySection[]): SummarySection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.flatMap((item) => {
      if (RETIRED_SUMMARY_LABELS.has(item.label)) return [];
      if (item.label === "City and area") {
        return [{ label: "City", value: item.value.split(",")[0].trim() || "—" }];
      }
      return [item];
    }),
  }));
}

function parseJsonObject<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

const sourceLabels: [string, string][] = [
  ["channel", "Channel"],
  ["campaign", "Ad campaign"],
  ["adId", "Ad ID"],
  ["medium", "Medium"],
  ["heardAbout", "Heard about us"],
  ["heardAboutOther", "Heard about us (other)"],
  ["referrer", "Referring employee"],
  ["landing", "Landing link"],
];

const statusOptions = ["new", "contacted", "converted", "closed"];

const statusStyles: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contacted: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  converted: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-red-500/15 text-red-300 border-red-500/30",
};

function extractLegacyCvName(message: string | null) {
  if (!message) return null;
  const match = message.match(/^CV File:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

function extractLegacyPosition(message: string | null) {
  if (!message) return null;
  const match = message.match(/^\s*Position:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

function messageWithoutCvLine(message: string | null) {
  if (!message) return "";
  return message
    .split("\n")
    .filter((line) => !/^CV File:/i.test(line.trim()))
    .join("\n")
    .trim();
}

export default function LeadDetail({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await adminFetch(`/api/leads/${leadId}`);
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
      } else {
        setError(res.status === 404 ? "Lead not found." : "Failed to load lead.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  async function updateStatus(status: string) {
    if (!lead) return;
    setUpdating(true);
    const res = await adminFetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status }),
    });
    if (res.ok) {
      setLead({ ...lead, status });
    }
    setUpdating(false);
  }

  async function handleDelete() {
    if (!lead) return;
    if (
      !confirm(
        "Delete this lead permanently? Name, CNIC, phone, CV file, and all related data will be removed."
      )
    ) {
      return;
    }
    const res = await adminFetch(`/api/leads?id=${lead.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/leads");
      router.refresh();
    } else {
      alert("Could not delete this lead. Please try again.");
    }
  }

  async function handleDownloadCv() {
    if (!lead?.cvPath) return;
    setDownloading(true);
    try {
      const res = await adminFetch(`/api/leads/${lead.id}/cv`);
      if (!res.ok) {
        alert("Failed to download CV. The file may be missing.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = lead.cvFileName || "cv.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading lead...</p>;
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-orange"
        >
          <ArrowLeft size={16} /> Back to Leads
        </Link>
        <p className="text-red-400">{error ?? "Lead not found."}</p>
      </div>
    );
  }

  const submitted = new Date(lead.createdAt);
  const legacyCvName = extractLegacyCvName(lead.message);
  const displayCvName = lead.cvFileName || legacyCvName;
  const hasDownloadableCv = Boolean(lead.cvPath);
  const cleanMessage = messageWithoutCvLine(lead.message);
  const application = parseJsonObject<ApplicationDetails>(lead.details);
  const source = parseJsonObject<Record<string, string>>(lead.source);
  const flags = parseFlags(lead.flags);
  const sourceRows = source
    ? sourceLabels.filter(([key]) => typeof source[key] === "string" && source[key].trim())
    : [];
  const futureOpenings = application?.answers?.futureOpenings === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-orange"
        >
          <ArrowLeft size={16} /> Back to Leads
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      <div className="admin-card glow-border rounded-lg bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="brand-label mb-2">
              {lead.referenceId
                ? `Application ${lead.referenceId}`
                : `Lead #${lead.id.slice(-6).toUpperCase()}`}
            </p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {lead.name}
            </h2>
            {(lead.queue || flags.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.queue && (
                  <span className="rounded-lg border border-foreground/15 px-2.5 py-1 text-xs font-semibold text-foreground">
                    Queue: {queueLabel(lead.queue)}
                  </span>
                )}
                {flags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-lg bg-orange/15 px-2.5 py-1 text-xs font-semibold text-orange"
                  >
                    {FLAG_LABELS[flag] ?? flag}
                  </span>
                ))}
                {futureOpenings && (
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    Open to future openings
                  </span>
                )}
              </div>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              statusStyles[lead.status] ??
              "bg-white/5 text-muted border-foreground/15"
            }`}
          >
            <Tag size={12} /> {lead.status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailRow icon={<User size={16} />} label="Name" value={lead.name} />
          <DetailRow
            icon={<Mail size={16} />}
            label="Email"
            value={
              lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-orange hover:underline"
                >
                  {lead.email}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            icon={<Phone size={16} />}
            label="Phone"
            value={
              lead.phone ? (
                <a
                  href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                  className="text-orange hover:underline"
                >
                  {lead.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            icon={<Building2 size={16} />}
            label={lead.referenceId ? "Branch preference" : "Company"}
            value={lead.company ?? "—"}
          />
          <DetailRow
            icon={<Briefcase size={16} />}
            label="Job Applied"
            value={
              lead.position?.trim() ||
              extractLegacyPosition(lead.message) ||
              "—"
            }
          />
          <DetailRow
            icon={<Calendar size={16} />}
            label="Submitted"
            value={`${submitted.toLocaleDateString()} · ${submitted.toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            )}`}
          />
          <div className="rounded-lg border border-foreground/10 bg-background/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Tag size={14} /> Status
            </div>
            <select
              value={lead.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updating}
              className="brand-input w-full"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <FileText size={14} /> CV File
          </div>
          <div className="rounded-lg border border-foreground/10 bg-background/50 p-4">
            {displayCvName ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">{displayCvName}</p>
                {hasDownloadableCv ? (
                  <button
                    type="button"
                    onClick={handleDownloadCv}
                    disabled={downloading}
                    className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    <Download size={16} />
                    {downloading ? "Downloading..." : "Download CV"}
                  </button>
                ) : (
                  <p className="text-xs text-muted">
                    File name only — CV was not uploaded for this older lead.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">No CV uploaded.</p>
            )}
          </div>
        </div>

        {application?.summary && currentSummary(application.summary).map((section) => (
          <div key={section.title} className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <ClipboardList size={14} /> {section.title}
            </div>
            <dl className="divide-y divide-foreground/8 rounded-lg border border-foreground/10 bg-background/50">
              {section.items.map((item) => (
                <div key={item.label} className="grid gap-1 p-3 sm:grid-cols-[2fr_3fr] sm:gap-4">
                  <dt className="text-xs text-muted">{item.label}</dt>
                  <dd className="whitespace-pre-wrap break-words text-sm text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        {application?.duplicates && application.duplicates.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Tag size={14} /> Earlier applications with the same phone or email
            </div>
            <ul className="space-y-2 rounded-lg border border-foreground/10 bg-background/50 p-4 text-sm">
              {application.duplicates.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/leads/${d.id}`} className="text-orange hover:underline">
                    {d.referenceId ?? `Lead #${d.id.slice(-6).toUpperCase()}`}
                  </Link>
                  <span className="text-muted">
                    {" "}
                    · {d.position ?? "—"} · {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sourceRows.length > 0 && source && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Megaphone size={14} /> Source
            </div>
            <dl className="divide-y divide-foreground/8 rounded-lg border border-foreground/10 bg-background/50">
              {sourceRows.map(([key, label]) => (
                <div key={key} className="grid gap-1 p-3 sm:grid-cols-[2fr_3fr] sm:gap-4">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="break-words text-sm text-foreground">{source[key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {!application && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <MessageSquare size={14} /> Message
            </div>
            <div className="rounded-lg border border-foreground/10 bg-background/50 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap min-h-[6rem]">
              {cleanMessage ? cleanMessage : "No message provided."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-background/50 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {icon} {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
