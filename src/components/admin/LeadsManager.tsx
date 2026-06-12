"use client";

import { useEffect, useState } from "react";
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

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeads() {
    const res = await adminFetch("/api/leads");
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchLeads();
    });
    return () => cancelAnimationFrame(handle);
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

  if (loading) {
    return <p className="text-muted">Loading leads...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted">
            {leads.length} total inquiries from the website
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="glow-border rounded-2xl bg-card p-12 text-center">
          <p className="text-muted">No leads yet. They will appear here when visitors submit the contact form.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-foreground/10">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-foreground/8 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.email}</td>
                  <td className="px-4 py-3 text-muted">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {lead.company ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                    {lead.message ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
