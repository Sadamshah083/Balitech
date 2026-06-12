"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Building2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-token";

type Office = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  email: string | null;
  hours: string | null;
  city: string | null;
  country: string;
  image: string | null;
  mapEmbedUrl: string | null;
  order: number;
  isActive: boolean;
  isHeadOffice: boolean;
};

const emptyForm = {
  name: "",
  slug: "",
  address: "",
  phone: "",
  email: "",
  hours: "Mon – Sat: 9:00 AM – 6:00 PM",
  city: "",
  country: "Pakistan",
  image: "",
  mapEmbedUrl: "",
  order: 0,
  isActive: true,
  isHeadOffice: false,
};

export default function OfficesManager() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchOffices() {
    const res = await adminFetch("/api/offices");
    if (res.ok) {
      const data = await res.json();
      setOffices(data.offices);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchOffices();
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, order: offices.length + 1 });
    setShowForm(true);
  }

  function openEdit(office: Office) {
    setEditingId(office.id);
    setForm({
      name: office.name,
      slug: office.slug,
      address: office.address,
      phone: office.phone ?? "",
      email: office.email ?? "",
      hours: office.hours ?? "",
      city: office.city ?? "",
      country: office.country,
      image: office.image ?? "",
      mapEmbedUrl: office.mapEmbedUrl ?? "",
      order: office.order,
      isActive: office.isActive,
      isHeadOffice: office.isHeadOffice,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      address: form.address,
      phone: form.phone || null,
      email: form.email || null,
      hours: form.hours || null,
      city: form.city || null,
      country: form.country || "Pakistan",
      image: form.image || null,
      mapEmbedUrl: form.mapEmbedUrl || null,
      order: form.order,
      isActive: form.isActive,
      isHeadOffice: form.isHeadOffice,
    };

    const res = editingId
      ? await adminFetch(`/api/offices/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/offices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchOffices();
    }

    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await adminFetch(`/api/offices/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOffices((prev) => prev.filter((o) => o.id !== id));
    }
  }

  if (loading) {
    return <p className="text-muted">Loading offices...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Offices & Branches</h2>
          <p className="text-sm text-muted">
            Manage all branch locations shown on Our Offices, Join Us, and contact sections.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Add Branch
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-2xl bg-card p-6"
        >
          <h3 className="font-bold text-foreground">
            {editingId ? "Edit Branch" : "New Branch"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Branch name * (e.g. Head Office)"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="brand-input"
            />
            <input
              type="text"
              placeholder="Slug (auto-generated if empty)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="brand-input"
            />
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="brand-input"
            />
            <input
              type="text"
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="brand-input"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="brand-input"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="brand-input"
            />
            <input
              type="text"
              placeholder="Working hours"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              className="brand-input sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Display order"
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: parseInt(e.target.value) || 0 })
              }
              className="brand-input"
            />
            <input
              type="text"
              placeholder="Image URL (e.g. /balitech_office/DSC03829.JPG)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="brand-input"
            />
          </div>

          <textarea
            placeholder="Full address *"
            required
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="brand-input w-full"
          />

          <input
            type="text"
            placeholder="Google Maps embed URL (optional — auto-generated from address)"
            value={form.mapEmbedUrl}
            onChange={(e) => setForm({ ...form, mapEmbedUrl: e.target.value })}
            className="brand-input w-full"
          />

          <div className="flex flex-wrap gap-6">
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
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isHeadOffice}
                onChange={(e) =>
                  setForm({ ...form, isHeadOffice: e.target.checked })
                }
                className="accent-orange"
              />
              Head office (primary contact & map)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Branch" : "Create Branch"}
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

      {offices.length === 0 ? (
        <div className="glow-border rounded-2xl bg-card p-12 text-center">
          <Building2 size={40} className="mx-auto mb-4 text-orange/60" />
          <p className="text-muted">No branches yet. Add your first office above.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {offices.map((office) => (
            <div
              key={office.id}
              className={`glow-border overflow-hidden rounded-2xl bg-card ${!office.isActive ? "opacity-50" : ""}`}
            >
              {office.image && (
                <div className="relative h-40 w-full">
                  <Image
                    src={office.image}
                    alt={office.name}
                    fill
                    unoptimized={office.image.startsWith("http")}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {office.name}
                      {office.isHeadOffice && (
                        <span className="ml-2 rounded-full bg-orange/15 px-2 py-0.5 text-xs font-bold text-orange">
                          Head Office
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-orange">
                      {[office.city, office.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(office)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(office.id, office.name)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="mb-3 flex items-start gap-2 text-sm text-muted">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-orange" />
                  {office.address}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  <span>Order: {office.order}</span>
                  <span className={office.isActive ? "text-green-400" : "text-red-400"}>
                    {office.isActive ? "Active" : "Hidden"}
                  </span>
                  {office.phone && <span>{office.phone}</span>}
                  {office.email && <span>{office.email}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
