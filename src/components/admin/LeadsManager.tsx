"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-token";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const statusOptions = ["new", "contacted", "converted", "closed"];
const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  status: "new",
};

export default function LeadsManager() {
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

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    const res = await adminFetch(
      `/api/leads?page=${page}&limit=${PAGE_SIZE}`
    );
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

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
        message: form.message || null,
        status: form.status,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setEditingLeadId(null);
      setForm(emptyForm);
      await fetchLeads(pagination.page);
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
      await fetchLeads(nextPage);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await adminFetch("/api/leads/export");
      if (!res.ok) {
        alert("Failed to export leads. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `balitech-leads-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
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

  if (loading && leads.length === 0) {
    return <p className="text-muted">Loading leads...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted">
            {pagination.total} total inquiries from the website
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || pagination.total === 0}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <Download size={16} />
          {exporting ? "Preparing..." : "Download Excel"}
        </button>
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
              <label className="brand-label mb-2 block">Email *</label>
              <input
                type="email"
                required
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
            No leads yet. They will appear here when visitors submit the contact
            form.
          </p>
        </div>
      ) : (
        <>
          <div className="admin-surface border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-card text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Message</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-foreground/8 hover:bg-surface"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="hover:text-orange"
                          >
                            {lead.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted">{lead.email}</td>
                        <td className="px-4 py-3 text-muted">
                          {lead.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {lead.company ?? "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                          {lead.message ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStatus(lead.id, e.target.value)
                            }
                            className="brand-input px-2 py-1"
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
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
