"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { campaignIconOptions, getCampaignIcon } from "@/lib/icons";
import { adminFetch } from "@/lib/admin-token";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  order: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  icon: "briefcase",
  order: 0,
  isActive: true,
};

export default function CampaignsManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchCampaigns() {
    const res = await adminFetch("/api/campaigns");
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchCampaigns();
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, order: campaigns.length + 1 });
    setShowForm(true);
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      description: campaign.description ?? "",
      icon: campaign.icon,
      order: campaign.order,
      isActive: campaign.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      icon: form.icon,
      order: form.order,
      isActive: form.isActive,
    };

    const res = editingId
      ? await adminFetch(`/api/campaigns/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchCampaigns();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    const res = await adminFetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  }

  if (loading) {
    return <p className="text-muted">Loading campaigns...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted">
            Manage strategic campaigns shown on the homepage
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Add Campaign
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-2xl bg-card p-6"
        >
          <h3 className="font-bold text-foreground">
            {editingId ? "Edit Campaign" : "New Campaign"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Title *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="brand-input"
            />
            <select
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="brand-input"
            >
              {campaignIconOptions.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Order"
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: parseInt(e.target.value) || 0 })
              }
              className="brand-input"
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="accent-orange"
              />
              Active (visible on website)
            </label>
          </div>
          <textarea
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="brand-input w-full"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-full border border-foreground/15 px-6 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <div className="glow-border rounded-2xl bg-card p-12 text-center">
          <p className="text-muted">No campaigns yet. Add your first campaign above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const Icon = getCampaignIcon(campaign.icon);
            return (
              <div
                key={campaign.id}
                className={`glow-border rounded-2xl bg-card p-6 ${!campaign.isActive ? "opacity-50" : ""}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-full bg-orange/10 p-3 text-orange">
                    <Icon size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(campaign)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(campaign.id)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-foreground">{campaign.title}</h3>
                {campaign.description && (
                  <p className="mt-1 text-sm text-muted">
                    {campaign.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                  <span>Order: {campaign.order}</span>
                  <span
                    className={
                      campaign.isActive ? "text-green-400" : "text-red-400"
                    }
                  >
                    {campaign.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
