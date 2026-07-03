"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-token";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

const statusOptions = ["new", "contacted", "converted", "closed"];

const statusStyles: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contacted: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  converted: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function LeadDetail({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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
    if (!confirm("Delete this lead permanently?")) return;
    const res = await adminFetch(`/api/leads?id=${lead.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/leads");
      router.refresh();
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
            <p className="brand-label mb-2">Lead #{lead.id.slice(-6).toUpperCase()}</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {lead.name}
            </h2>
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
              <a
                href={`mailto:${lead.email}`}
                className="text-orange hover:underline"
              >
                {lead.email}
              </a>
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
            label="Company"
            value={lead.company ?? "—"}
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
            <MessageSquare size={14} /> Message
          </div>
          <div className="rounded-lg border border-foreground/10 bg-background/50 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap min-h-[6rem]">
            {lead.message?.trim() ? lead.message : "No message provided."}
          </div>
        </div>
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
