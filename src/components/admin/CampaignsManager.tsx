"use client";

import { useEffect, useId, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  campaignLocations,
  defaultCampaignLocation,
  parseCampaignLocations,
} from "@/lib/campaign-locations";
import { campaignIconOptions, getCampaignIcon } from "@/lib/icons";
import { adminFetch } from "@/lib/admin-token";
import AdminModal from "./AdminModal";
import ConfirmDialog from "./ConfirmDialog";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  /** Every branch running this campaign. The API always sends a list. */
  locations: string[];
  order: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  icon: "briefcase",
  locations: [defaultCampaignLocation] as string[],
  order: 0,
  isActive: true,
};

/**
 * Turns a failed response into something worth showing.
 *
 * Every mutation here used to be wrapped in a bare `if (res.ok)`, so a rejected
 * save or delete produced no message, no console output, and no change on
 * screen — indistinguishable from a button that does nothing.
 */
async function readError(res: Response, fallback: string) {
  if (res.status === 401) {
    return "Your admin session has expired. Reload the page and sign in again.";
  }

  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error) return data.error;
  } catch {
    /* Error pages are not always JSON; the status line still tells us enough. */
  }

  return `${fallback} (HTTP ${res.status})`;
}

export default function CampaignsManager({
  initialData,
}: {
  initialData?: Campaign[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [listError, setListError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fieldId = useId();

  async function fetchCampaigns() {
    try {
      const res = await adminFetch("/api/campaigns");
      if (!res.ok) {
        setListError(await readError(res, "Could not load campaigns"));
        return;
      }
      const data = await res.json();
      setCampaigns(data.campaigns);
      setListError(null);
    } catch {
      setListError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialData) return;
    const handle = setTimeout(fetchCampaigns, 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    /* Continues the existing sequence rather than counting rows: the orders in
       use are sparse, so a row count can repeat a number already taken. */
    const nextOrder =
      campaigns.reduce((highest, c) => Math.max(highest, c.order), 0) + 1;
    setEditingId(null);
    setForm({ ...emptyForm, order: nextOrder });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      description: campaign.description ?? "",
      icon: campaign.icon,
      locations: parseCampaignLocations(campaign.locations),
      order: campaign.order,
      isActive: campaign.isActive,
    });
    setFormError(null);
    setShowForm(true);
  }

  /**
   * Keeps the picker in the order branches are listed in, rather than the
   * order they happened to be clicked, so a job's branches read the same on
   * the card as they do here.
   */
  function toggleBranch(branch: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      locations: campaignLocations.filter((option) =>
        option === branch ? checked : current.locations.includes(option)
      ),
    }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required.");
      return;
    }

    /* Checkboxes cannot express "required" the way a select can, so the one
       rule they need is enforced here. */
    if (form.locations.length === 0) {
      setFormError("Select at least one branch.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      title,
      description: form.description.trim() || null,
      icon: form.icon,
      locations: form.locations,
      order: form.order,
      isActive: form.isActive,
    };

    try {
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

      if (!res.ok) {
        setFormError(
          await readError(
            res,
            editingId ? "Could not save changes" : "Could not create campaign"
          )
        );
        return;
      }

      await fetchCampaigns();
      closeForm();
    } catch {
      setFormError("Could not reach the server. Your changes were not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const target = pendingDelete;
    if (!target || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await adminFetch(`/api/campaigns/${target.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setDeleteError(await readError(res, "Could not delete campaign"));
        return;
      }

      /* Re-reads the list instead of filtering locally, so the table always
         reflects what the database actually holds. */
      await fetchCampaigns();
      setPendingDelete(null);
    } catch {
      setDeleteError("Could not reach the server. Nothing was deleted.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading campaigns...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted">
            Manage strategic campaigns shown on the homepage
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} aria-hidden="true" />
          Add Campaign
        </button>
      </div>

      {listError && (
        <p className="admin-modal__error mb-6" role="alert">
          {listError}
        </p>
      )}

      <AdminModal
        open={showForm}
        title={editingId ? "Edit Campaign" : "New Campaign"}
        description={
          editingId
            ? "Update this campaign and save to publish the change."
            : "Add a campaign to show on the homepage."
        }
        onClose={closeForm}
        dismissible={!saving}
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
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        {/* The actions live in the dialog footer so they stay visible while the
            fields scroll; `form` on the submit button links the two back up. */}
        <form id={`${fieldId}-form`} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-title`} className="brand-label mb-2 block">
                Title *
              </label>
              <input
                id={`${fieldId}-title`}
                type="text"
                placeholder="Campaign Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-icon`} className="brand-label mb-2 block">
                Icon *
              </label>
              <select
                id={`${fieldId}-icon`}
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="brand-input w-full"
              >
                {campaignIconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
            {/* A campaign can run at more than one branch — Final Expense is
                hiring at Iran Road and Commercial — so this is a set rather
                than a choice. Every branch is listed because there are only a
                few of them, which makes the ones in use readable at a glance. */}
            <fieldset>
              <legend className="brand-label mb-2 block">Branches *</legend>
              <div className="admin-branch-picker">
                {campaignLocations.map((location) => {
                  const checked = form.locations.includes(location);
                  return (
                    <label
                      key={location}
                      className={`admin-branch-picker__option${
                        checked ? " is-checked" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleBranch(location, e.target.checked)}
                        className="accent-orange"
                      />
                      {location}
                    </label>
                  );
                })}
              </div>
              <p className="admin-branch-picker__hint">
                {form.locations.length === 0
                  ? "Select at least one branch."
                  : form.locations.length === 1
                    ? "Applicants will not be asked to choose a branch."
                    : `Applicants can choose between ${form.locations.length} branches.`}
              </p>
            </fieldset>
            <div>
              <label htmlFor={`${fieldId}-order`} className="brand-label mb-2 block">
                Order
              </label>
              <input
                id={`${fieldId}-order`}
                type="number"
                placeholder="Sort Order"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className="brand-input w-full"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${fieldId}-description`}
              className="brand-label mb-2 block"
            >
              Description
            </label>
            <textarea
              id={`${fieldId}-description`}
              placeholder="Campaign Description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="brand-input w-full"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-orange"
            />
            Active (visible on website)
          </label>

          {formError && (
            <p className="admin-modal__error" role="alert">
              {formError}
            </p>
          )}
        </form>
      </AdminModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete campaign"
        message={`Delete "${pendingDelete?.title ?? ""}"? It will be removed from the homepage. This cannot be undone.`}
        pending={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />

      {campaigns.length === 0 ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <p className="text-muted">
            No campaigns yet. Use Add Campaign to create your first one.
          </p>
        </div>
      ) : (
        <div className="admin-surface border border-foreground/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-card text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Icon</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Branches</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const Icon = getCampaignIcon(campaign.icon);
                  const branches = parseCampaignLocations(campaign.locations);
                  return (
                    <tr
                      key={campaign.id}
                      className={`border-t border-foreground/8 hover:bg-surface ${
                        !campaign.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="inline-block rounded-lg bg-orange/10 p-2 text-orange">
                          <Icon size={18} aria-hidden="true" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {campaign.title}
                      </td>
                      {/* Truncated on one line so a job at three branches does
                          not stand a row taller than the rest; the full list is
                          on hover and in the edit dialog. */}
                      <td
                        className="max-w-65 truncate px-4 py-3 text-muted"
                        title={branches.join(", ")}
                      >
                        {branches.join(", ")}
                      </td>
                      <td className="max-w-65 truncate px-4 py-3 text-muted">
                        {campaign.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{campaign.order}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${
                            campaign.isActive
                              ? "bg-green-400/10 text-green-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {campaign.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(campaign)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Edit ${campaign.title}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(campaign);
                            }}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                            aria-label={`Delete ${campaign.title}`}
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
