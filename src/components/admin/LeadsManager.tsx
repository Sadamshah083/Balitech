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
  group?: "campaign" | "position";
};

function positionOptionLabel(p: PositionOption) {
  return `${p.value} (${p.leads} lead${p.leads === 1 ? "" : "s"} · ${p.cvs} CV${p.cvs === 1 ? "" : "s"})`;
}

type BranchOption = {
  value: string;
  leads: number;
  cvs: number;
};

function branchOptionLabel(b: BranchOption) {
  return `${b.value} (${b.leads} lead${b.leads === 1 ? "" : "s"})`;
}

const statusOptions = ["new", "contacted", "converted", "closed"];
const PAGE_SIZE = 20;

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
  const [queueFilter, setQueueFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalCvs, setTotalCvs] = useState(0);
  /* CVs among the leads matching the current filters, from the list endpoint. */
  const [filteredCvs, setFilteredCvs] = useState(0);
  const [downloadingCvs, setDownloadingCvs] = useState(false);
  const [initialized, setInitialized] = useState(false);

  /** The active filters as query params, shared by the list, CV and Excel requests. */
  const filterQuery = useCallback(() => {
    const query = new URLSearchParams();
    if (positionFilter) query.set("position", positionFilter);
    if (queueFilter) query.set("queue", queueFilter);
    if (branchFilter) query.set("branch", branchFilter);
    return query;
  }, [positionFilter, queueFilter, branchFilter]);

  const hasFilters = Boolean(positionFilter || queueFilter || branchFilter);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      const query = filterQuery();
      query.set("page", String(page));
      query.set("limit", String(PAGE_SIZE));

      const res = await adminFetch(`/api/leads?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
        setFilteredCvs(data.cvCount ?? 0);
      }
      setLoading(false);
      setInitialized(true);
    },
    [filterQuery]
  );

  const fetchPositions = useCallback(async () => {
    const [res, branchRes] = await Promise.all([
      adminFetch("/api/leads/positions"),
      adminFetch("/api/leads/branches"),
    ]);
    if (res.ok) {
      const data = await res.json();
      setPositions(data.positions ?? []);
      setTotalLeads(data.totals?.leads ?? 0);
      setTotalCvs(data.totals?.cvs ?? 0);
    }
    if (branchRes.ok) {
      const data = await branchRes.json();
      setBranches(data.branches ?? []);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const query = filterQuery();
      query.set("page", "1");
      query.set("limit", String(PAGE_SIZE));

      const res = await adminFetch(`/api/leads?${query.toString()}`);
      if (res.ok && active) {
        const data = await res.json();
        setLeads(data.leads);
        setPagination(data.pagination);
        setFilteredCvs(data.cvCount ?? 0);
      }
      if (active) {
        setLoading(false);
        setInitialized(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [filterQuery]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [res, branchRes] = await Promise.all([
        adminFetch("/api/leads/positions"),
        adminFetch("/api/leads/branches"),
      ]);
      if (res.ok && active) {
        const data = await res.json();
        setPositions(data.positions ?? []);
        setTotalLeads(data.totals?.leads ?? 0);
        setTotalCvs(data.totals?.cvs ?? 0);
      }
      if (branchRes.ok && active) {
        const data = await branchRes.json();
        setBranches(data.branches ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await adminFetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
  }

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

  async function handleExport() {
    setExporting(true);
    try {
      const query = filterQuery().toString();
      const res = await adminFetch(`/api/leads/export${query ? `?${query}` : ""}`);
      if (!res.ok) {
        alert("Failed to export leads. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `balitech-leads${hasFilters ? "-filtered" : ""}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadCvs() {
    setDownloadingCvs(true);
    try {
      const query = filterQuery().toString();
      const res = await adminFetch(`/api/leads/cvs${query ? `?${query}` : ""}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to download CVs. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      const slug =
        [positionFilter, branchFilter]
          .filter(Boolean)
          .map((part) => part.replace(/[^\w]+/g, "-").toLowerCase())
          .join("-") || (hasFilters ? "filtered" : "all-jobs");
      link.href = url;
      link.download = `balitech-cvs-${slug}-${stamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

  const selectedCvCount = hasFilters ? filteredCvs : totalCvs;
  const selectionLabel =
    [positionFilter, branchFilter, queueFilter ? queueLabel(queueFilter) : ""]
      .filter(Boolean)
      .join(" · ") || "all jobs";

  if (!initialized) {
    return <p className="text-muted">Loading leads...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted">
            {hasFilters
              ? `${pagination.total} of ${totalLeads} inquiries match these filters`
              : `${pagination.total} total inquiries from the website`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || pagination.total === 0}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <Download size={16} />
          {exporting
            ? "Preparing..."
            : hasFilters
              ? `Download Excel (${pagination.total})`
              : "Download Excel"}
        </button>
      </div>

      <div className="admin-card glow-border mb-6 rounded-lg bg-card p-4 sm:p-5">
        {/* One row on desktop: the three filters share the width and the
            actions sit at the end, aligned to the bottom of the selects. */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
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
              {positions.map((p) => (
                <option key={p.value} value={p.value}>
                  {positionOptionLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
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
              {branches.map((b) => (
                <option key={b.value} value={b.value}>
                  {branchOptionLabel(b)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
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

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-1 xl:flex-nowrap">
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setPositionFilter("");
                  setQueueFilter("");
                  setBranchFilter("");
                }}
                className="whitespace-nowrap rounded-lg border border-foreground/15 px-4 py-2 text-sm text-muted transition hover:border-orange/40 hover:text-foreground"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadCvs}
              disabled={downloadingCvs || selectedCvCount === 0}
              className="btn-primary inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
              title={`Download CVs for ${selectionLabel}`}
            >
              <FileArchive size={16} />
              {downloadingCvs
                ? "Zipping..."
                : `Download CVs (${selectedCvCount})`}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {selectedCvCount === 0
            ? "No uploaded CVs available for this selection."
            : `Downloads a ZIP with ${selectedCvCount} CV file${
                selectedCvCount === 1 ? "" : "s"
              } only — ${selectionLabel}. Lead data stays in the Excel export.`}
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
            {hasFilters
              ? `No leads match ${selectionLabel}. Try different filters or clear them.`
              : "No leads yet. They will appear here when visitors submit the contact form."}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-surface border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                {/* Fixed layout, because the widths cannot be left to the
                    content: applicants paste the office address into Company,
                    and a single 90-character value wrapped to eleven lines and
                    set the height of the whole row. Every cell below is one
                    line and clipped, so rows stay uniform however long a value
                    is, and the full text is on the lead's own page.

                    The shares are set so that the values that have to be read
                    in full are not the ones that get clipped: a phone number, a
                    status control and a date each get enough room at the
                    minimum width, and the slack comes out of email, company and
                    message, which are the ones a reader scans rather than
                    reads. */}
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  {/* 13% because a +92 number needs every pixel of it. */}
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-card text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Company / Branch</th>
                    <th className="px-3 py-3 font-medium">Job Applied</th>
                    <th className="px-3 py-3 font-medium">Message / Review</th>
                    <th className="px-3 py-3 font-medium">Status</th>
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
                          <td className="px-3 py-3 text-muted">
                            <span className="block truncate text-xs">{queueLabel(lead.queue)}</span>
                            {parseFlags(lead.flags).map((flag) => (
                              <span
                                key={flag}
                                className="mr-1 mt-1 inline-block rounded bg-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange"
                              >
                                {FLAG_LABELS[flag] ?? flag}
                              </span>
                            ))}
                          </td>
                        ) : (
                          <td
                            className="truncate px-3 py-3 text-muted"
                            title={lead.message ?? undefined}
                          >
                            {lead.message ?? "—"}
                          </td>
                        )}
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStatus(lead.id, e.target.value)
                            }
                            className="brand-input w-full px-2 py-1"
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
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
