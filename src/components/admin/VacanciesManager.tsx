"use client";

import { useEffect, useId, useState } from "react";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { PublicVacancy } from "@/lib/careers/application";
import AdminModal from "./AdminModal";
import ConfirmDialog from "./ConfirmDialog";

type Vacancy = PublicVacancy & { order: number; isActive: boolean };

type FormState = {
  title: string;
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

export default function VacanciesManager() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [branches, setBranches] = useState<string[]>([...campaignLocations]);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  function openCreate() {
    const nextOrder = vacancies.reduce((highest, v) => Math.max(highest, v.order), 0) + 1;
    setEditingId(null);
    setForm({ ...emptyForm, branches: [...branches], order: nextOrder });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(vacancy: Vacancy) {
    setEditingId(vacancy.id);
    setForm({
      title: vacancy.title,
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
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  /* Picking a known position fills in its usual department, question groups
     and CV rule, which HR can then adjust. Only on new vacancies, so editing
     a title never silently rewrites settings someone chose. */
  function changeTitle(title: string) {
    const known = editingId ? null : findCatalogPosition(title);
    setForm((current) =>
      known
        ? {
            ...current,
            title,
            department: known.department,
            roleGroups: known.groups,
            cvRequired: Boolean(known.cvRequired),
          }
        : { ...current, title }
    );
  }

  function toggle<T extends string>(list: T[], value: T, checked: boolean, order: readonly T[]) {
    return order.filter((item) => (item === value ? checked : list.includes(item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (form.branches.length === 0 && !form.remoteAllowed) {
      setFormError("Enable at least one branch, or allow remote work.");
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
    url.searchParams.set("position", vacancy.id);
    if (vacancy.branches.length === 1) url.searchParams.set("branch", vacancy.branches[0]);
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
            Only active vacancies appear in the careers application form. Hide a vacancy as soon as
            it stops accepting applications.
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
          No vacancies yet, so the careers form is offering Customer Service Representative and Sales Agent at every branch.
          Once you add a vacancy, only the vacancies listed here are offered.
        </p>
      )}

      <AdminModal
        open={showForm}
        title={editingId ? "Edit Vacancy" : "New Vacancy"}
        description="Settings here control which questions applicants are asked."
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
        <form id={`${fieldId}-form`} onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-department`} className="brand-label mb-2 block">
                Department *
              </label>
              <select
                id={`${fieldId}-department`}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="brand-input w-full"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${fieldId}-title`} className="brand-label mb-2 block">
                Position title *
              </label>
              <input
                id={`${fieldId}-title`}
                type="text"
                required
                list={`${fieldId}-positions`}
                placeholder="e.g. Sales Agent"
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
          </div>

          <fieldset>
            <legend className="brand-label mb-2 block">Question groups</legend>
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
              A vacancy can belong to several groups. Each group adds its own questions to the form.
            </p>
          </fieldset>

          <fieldset>
            <legend className="brand-label mb-2 block">Branches *</legend>
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
              <label className={`admin-branch-picker__option${form.remoteAllowed ? " is-checked" : ""}`}>
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
              Applicants choose from these branches on the public form.
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={`${fieldId}-days`} className="brand-label mb-2 block">
                Working days
              </label>
              <input
                id={`${fieldId}-days`}
                type="text"
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
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-arrangement`} className="brand-label mb-2 block">
                Work arrangement
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

          {form.roleGroups.includes("campaign") && (
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
                <option value="">Applicant chooses a campaign</option>
                {[...new Set([...campaigns, ...(form.campaign ? [form.campaign] : [])])].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="admin-branch-picker__hint">
                Set this when the vacancy is for one campaign, so applicants are not asked.
              </p>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.cvRequired}
              onChange={(e) => setForm({ ...form, cvRequired: e.target.checked })}
              className="accent-orange"
            />
            CV required (use for leadership and specialist vacancies)
          </label>

          <div>
            <label htmlFor={`${fieldId}-question`} className="brand-label mb-2 block">
              Vacancy-specific question
            </label>
            <input
              id={`${fieldId}-question`}
              type="text"
              maxLength={300}
              placeholder="Replaces “Which skills or tasks best match this position?”"
              value={form.customQuestion}
              onChange={(e) => setForm({ ...form, customQuestion: e.target.value })}
              className="brand-input w-full"
            />
          </div>

          <div>
            <label htmlFor={`${fieldId}-description`} className="brand-label mb-2 block">
              Short description
            </label>
            <textarea
              id={`${fieldId}-description`}
              rows={2}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="brand-input w-full"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-order`} className="brand-label mb-2 block">
                Order
              </label>
              <input
                id={`${fieldId}-order`}
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="brand-input w-full"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="accent-orange"
              />
              Accepting applications (listed on the form)
            </label>
          </div>

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
            <table className="w-full min-w-[960px] text-left text-sm">
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
                      <td className="px-4 py-3 text-muted">{departmentLabel(vacancy.department)}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted" title={where}>
                        {where || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted">
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
