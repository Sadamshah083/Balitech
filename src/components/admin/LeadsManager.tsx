"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-token";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileArchive,
  Pencil,
  Trash2,
} from "lucide-react";
import { FLAG_LABELS, QUEUES, parseFlags, queueLabel } from "@/lib/careers/review";
import { EXPERIENCE_OPTIONS, optionLabel } from "@/lib/careers/catalog";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  referenceId?: string | null;
  queue?: string | null;
  flags?: string | null;
  details?: string | null;
  cvPath?: string | null;
  exportedAt?: string | null;
  cvDownloadedAt?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PositionOption = {
  value: string;
  leads: number;
  cvs: number;
  newLeads?: number;
  newCvs?: number;
  group?: "campaign" | "position";
};

type BranchOption = {
  value: string;
  leads: number;
  cvs: number;
};

const POSITION_GROUPS = [
  { group: "campaign", label: "Campaigns" },
  { group: "position", label: "Positions" },
] as const;

function positionOptionLabel(p: PositionOption) {
  return `${p.value} (${p.leads} lead${p.leads === 1 ? "" : "s"} · ${p.cvs} CV${p.cvs === 1 ? "" : "s"})`;
}

const statusOptions = ["new", "contacted", "converted", "closed"];
const PAGE_SIZE = 25;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  position: "",
  message: "",
  status: "new",
};

function extractPositionFromMessage(message: string | null) {
  if (!message) return null;
  const match = message.match(/^\s*Position:\s*(.+)$/im);
  return match?.[1]?.trim() || null;
}

function leadPosition(lead: Lead) {
  return lead.position?.trim() || extractPositionFromMessage(lead.message);
}

function formatDownloadDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function leadExperience(lead: Lead) {
  if (!lead.details) return null;
  try {
    const parsed = JSON.parse(lead.details) as {
      answers?: { experience?: string };
    };
    const value = parsed.answers?.experience?.trim();
    if (!value) return null;
    return optionLabel(EXPERIENCE_OPTIONS, value) || value;
  } catch {
    return null;
  }
}

function reviewCellTitle(lead: Lead) {
  if (!lead.referenceId) return lead.message ?? undefined;
  const parts = [
    leadExperience(lead),
    queueLabel(lead.queue),
    parseFlags(lead.flags)
      .map((flag) => FLAG_LABELS[flag] ?? flag)
      .join(", "),
  ].filter(Boolean);
  return parts.join(" · ") || undefined;
}

export default function LeadsManager() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [positionFilter, setPositionFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [queueFilter, setQueueFilter] = useState("");
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const [newCvs, setNewCvs] = useState(0);
  const [downloadingCvs, setDownloadingCvs] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (positionFilter) query.set("position", positionFilter);
      if (branchFilter) query.set("branch", branchFilter);
      if (queueFilter) query.set("queue", queueFilter);

      const res = await adminFetch(`/api/leads?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
      }
      setLoading(false);
      setInitialized(true);
    },
    [positionFilter, branchFilter, queueFilter]
  );

  const fetchPositions = useCallback(async () => {
    const query = new URLSearchParams();
    if (branchFilter) query.set("branch", branchFilter);
    if (queueFilter) query.set("queue", queueFilter);
    const qs = query.toString();
    const res = await adminFetch(`/api/leads/positions${qs ? `?${qs}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setPositions(data.positions ?? []);
      setTotalLeads(data.totals?.leads ?? 0);
      setNewLeads(data.totals?.newLeads ?? 0);
      setNewCvs(data.totals?.newCvs ?? 0);
    }
  }, [branchFilter, queueFilter]);

  const fetchBranches = useCallback(async () => {
    const res = await adminFetch("/api/leads/branches");
    if (res.ok) {
      const data = await res.json();
      setBranches(data.branches ?? []);
    }
  }, []);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  function openEdit(lead: Lead) {
    setEditingLeadId(lead.id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company || "",
      position: leadPosition(lead) || "",
      message: lead.message || "",
      status: lead.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await adminFetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingLeadId,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        company: form.company || null,
        position: form.position || null,
        message: form.message || null,
        status: form.status,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setEditingLeadId(null);
      setForm(emptyForm);
      await Promise.all([fetchLeads(pagination.page), fetchPositions()]);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const res = await adminFetch(`/api/leads?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const nextPage =
        leads.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      await Promise.all([fetchLeads(nextPage), fetchPositions()]);
    }
  }

  async function handleExport(all = false) {
    setExporting(true);
    try {
      const query = new URLSearchParams();
      if (all) query.set("all", "1");
      if (positionFilter) query.set("position", positionFilter);
      if (branchFilter) query.set("branch", branchFilter);
      if (queueFilter) query.set("queue", queueFilter);
      const qs = query.toString();
      const res = await adminFetch(`/api/leads/export${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to export leads. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `balitech-leads-${all ? "all" : "new"}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await Promise.all([fetchLeads(pagination.page), fetchPositions()]);
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadCvs() {
    setDownloadingCvs(true);
    try {
      const query = new URLSearchParams();
      if (positionFilter) query.set("position", positionFilter);
      if (branchFilter) query.set("branch", branchFilter);
      if (queueFilter) query.set("queue", queueFilter);
      const qs = query.toString();
      const res = await adminFetch(`/api/leads/cvs${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to download CVs. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      const slug = positionFilter
        ? positionFilter.replace(/[^\w]+/g, "-").toLowerCase()
        : "all-jobs";
      link.href = url;
      link.download = `balitech-cvs-new-${slug}-${stamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await Promise.all([fetchLeads(pagination.page), fetchPositions(), fetchBranches()]);
    } finally {
      setDownloadingCvs(false);
    }
  }

  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) {
      return;
    }
    fetchLeads(page);
  }

  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  const selectedPosition = positions.find((p) => p.value === positionFilter);
  const selectedNewCvs = positionFilter
    ? (selectedPosition?.newCvs ?? 0)
    : newCvs;
  const selectedNewLeads = positionFilter
    ? (selectedPosition?.newLeads ?? 0)
    : newLeads;

  if (!initialized) {
    return <p className="text-muted">Loading leads...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted">
            {positionFilter || branchFilter || queueFilter
              ? `${pagination.total} of ${totalLeads} inquiries match these filters`
              : `${pagination.total} total inquiries from the website`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => handleExport(false)}
            disabled={exporting || selectedNewLeads === 0}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            <Download size={16} />
            {exporting
              ? "Preparing..."
              : `Download New Leads (${selectedNewLeads})`}
          </button>
          <button
            type="button"
            onClick={() => handleExport(true)}
            disabled={exporting || totalLeads === 0}
            className="text-sm text-sky-400 transition hover:text-sky-300 disabled:opacity-40"
          >
            Download all again
          </button>
        </div>
      </div>

      <div className="admin-card glow-border mb-6 rounded-lg bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <label
              htmlFor="lead-position-filter"
              className="brand-label mb-2 block"
            >
              Filter by job applied
            </label>
            <select
              id="lead-position-filter"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="brand-input w-full"
            >
              <option value="">
                All jobs ({totalLeads} lead{totalLeads === 1 ? "" : "s"})
              </option>
              {POSITION_GROUPS.map(({ group, label }) => {
                const items = positions.filter((p) => (p.group ?? "position") === group);
                if (items.length === 0) return null;
                return (
                  <optgroup key={group} label={label}>
                    {items.map((p) => (
                      <option key={p.value} value={p.value}>
                        {positionOptionLabel(p)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="w-full lg:max-w-xs">
            <label htmlFor="lead-branch-filter" className="brand-label mb-2 block">
              Branch applied
            </label>
            <select
              id="lead-branch-filter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="brand-input w-full"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.value} value={branch.value}>
                  {branch.value} ({branch.leads})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:max-w-xs">
            <label htmlFor="lead-queue-filter" className="brand-label mb-2 block">
              Review queue
            </label>
            <select
              id="lead-queue-filter"
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              className="brand-input w-full"
            >
              <option value="">All queues</option>
              {QUEUES.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            {(positionFilter || branchFilter || queueFilter) && (
              <button
                type="button"
                onClick={() => {
                  setPositionFilter("");
                  setBranchFilter("");
                  setQueueFilter("");
                }}
                className="rounded-lg border border-foreground/15 px-4 py-2 text-sm text-muted transition hover:border-orange/40 hover:text-foreground"
              >
                Clear filter
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadCvs}
              disabled={downloadingCvs || selectedNewCvs === 0}
              className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
              title={
                positionFilter
                  ? `Download new CVs for ${positionFilter}`
                  : "Download new CVs for all jobs"
              }
            >
              <FileArchive size={16} />
              {downloadingCvs
                ? "Zipping..."
                : `Download New CVs (${selectedNewCvs})`}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {selectedNewCvs === 0
            ? "No new CVs available for this selection."
            : `Downloads a ZIP with the ${selectedNewCvs} new CV${
                selectedNewCvs === 1 ? "" : "s"
              }${positionFilter ? ` for ${positionFilter}` : " for all jobs"}. CVs already downloaded are left out, and these will be marked as downloaded.`}
        </p>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-lg admin-card bg-card p-6"
        >
          <h3 className="font-bold text-foreground">Edit Lead</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-2 block">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Job Applied</label>
              <input
                type="text"
                list="lead-position-options"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Sales Agent"
                className="brand-input w-full"
              />
              <datalist id="lead-position-options">
                {positions.map((p) => (
                  <option key={p.value} value={p.value} />
                ))}
              </datalist>
            </div>
            <div className="sm:col-span-2">
              <label className="brand-label mb-2 block">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
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
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingLeadId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-foreground/15 px-6 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {pagination.total === 0 ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <p className="text-muted">
            {positionFilter
              ? `No leads found for "${positionFilter}". Try a different job or clear the filter.`
              : "No leads yet. They will appear here when visitors submit the contact form."}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-surface border border-foreground/10">
            <div className="admin-leads-table-scroll">
              <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                {/* Fixed layout keeps row height stable. Message / Review is
                    given more width and may wrap so experience and flags stay
                    readable; both scrollbars stay inside this panel. */}
                <colgroup>
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[18%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-card text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Company / Branch</th>
                    <th className="px-3 py-3 font-medium">Job Applied</th>
                    <th className="px-3 py-3 font-medium">Message / Review</th>
                    <th className="px-3 py-3 font-medium">Downloaded</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/admin/leads/${lead.id}`);
                          }
                        }}
                        className="cursor-pointer border-t border-foreground/8 hover:bg-surface"
                      >
                        <td
                          className="truncate px-3 py-3 font-medium text-foreground"
                          title={lead.name}
                        >
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="hover:text-orange"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.name}
                          </Link>
                          {lead.referenceId && (
                            <span className="block truncate text-xs font-normal text-muted">
                              {lead.referenceId}
                            </span>
                          )}
                        </td>
                        <td
                          className="truncate px-3 py-3 text-muted"
                          title={lead.email || undefined}
                        >
                          {lead.email || "—"}
                        </td>
                        <td
                          className="truncate px-3 py-3 text-muted"
                          title={lead.phone ?? undefined}
                        >
                          {lead.phone ?? "—"}
                        </td>
                        <td
                          className="truncate px-3 py-3 text-muted"
                          title={lead.company ?? undefined}
                        >
                          {lead.company ?? "—"}
                        </td>
                        <td
                          className="truncate px-3 py-3 text-muted"
                          title={leadPosition(lead) ?? undefined}
                        >
                          {leadPosition(lead) ?? "—"}
                        </td>
                        {lead.referenceId ? (
                          <td
                            className="px-3 py-3 text-muted align-top"
                            title={reviewCellTitle(lead)}
                          >
                            {leadExperience(lead) ? (
                              <span className="block text-sm leading-snug text-foreground">
                                {leadExperience(lead)}
                              </span>
                            ) : null}
                            <span className="mt-0.5 block text-xs leading-snug">
                              {queueLabel(lead.queue) || "Recruitment"}
                            </span>
                            {parseFlags(lead.flags).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {parseFlags(lead.flags).map((flag) => (
                                  <span
                                    key={flag}
                                    className="inline-block rounded bg-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange"
                                  >
                                    {FLAG_LABELS[flag] ?? flag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        ) : (
                          <td
                            className="px-3 py-3 text-muted align-top"
                            title={lead.message ?? undefined}
                          >
                            <span className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-snug">
                              {lead.message ?? "—"}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            {lead.exportedAt ? (
                              <span className="text-xs text-muted">
                                Lead ✓ {formatDownloadDate(lead.exportedAt)}
                              </span>
                            ) : (
                              <span className="inline-flex w-fit rounded bg-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange">
                                New Lead
                              </span>
                            )}
                            {lead.cvPath ? (
                              lead.cvDownloadedAt ? (
                                <span className="text-xs text-muted">
                                  CV ✓ {formatDownloadDate(lead.cvDownloadedAt)}
                                </span>
                              ) : (
                                <span className="inline-flex w-fit rounded bg-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange">
                                  New CV
                                </span>
                              )
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          className="px-2 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-center gap-1">
                            <Link
                              href={`/admin/leads/${lead.id}`}
                              className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-orange"
                              title="View"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEdit(lead)}
                              className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(lead.id)}
                              className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Showing {rangeStart}–{rangeEnd} of {pagination.total} leads
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-3 py-2 text-sm font-medium text-foreground transition hover:border-orange/40 hover:text-orange disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="px-2 text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={
                  pagination.page >= pagination.totalPages || loading
                }
                className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-3 py-2 text-sm font-medium text-foreground transition hover:border-orange/40 hover:text-orange disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
