"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, Video } from "lucide-react";
import {
  mediaCategoryOptions,
  mediaKindOptions,
  mediaSectionOptions,
} from "@/lib/media";
import { adminFetch } from "@/lib/admin-token";

type MediaItem = {
  id: string;
  title: string;
  alt: string | null;
  src: string;
  kind: string;
  section: string;
  category: string;
  order: number;
  isFeatured: boolean;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  alt: "",
  src: "",
  kind: "image",
  section: "gallery",
  category: "Events",
  order: 0,
  isFeatured: false,
  isActive: true,
};

function sectionLabel(value: string) {
  return mediaSectionOptions.find((o) => o.value === value)?.label ?? value;
}

export default function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState("all");

  async function fetchMedia() {
    const res = await adminFetch("/api/media");
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchMedia();
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      order: media.length + 1,
      section: filterSection !== "all" ? filterSection : "gallery",
    });
    setShowForm(true);
  }

  function openEdit(item: MediaItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      alt: item.alt ?? "",
      src: item.src,
      kind: item.kind,
      section: item.section,
      category: item.category,
      order: item.order,
      isFeatured: item.isFeatured,
      isActive: item.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      alt: form.alt || null,
      src: form.src,
      kind: form.kind,
      section: form.section,
      category: form.category,
      order: form.order,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    const res = editingId
      ? await adminFetch(`/api/media/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchMedia();
    }

    setSaving(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await adminFetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== id));
    }
  }

  const filtered =
    filterSection === "all"
      ? media
      : media.filter((item) => item.section === filterSection);

  if (loading) {
    return <p className="text-muted">Loading gallery media...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gallery & Media</h2>
          <p className="text-sm text-muted">
            Manage photos and videos across the gallery, workspace, and video sections.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Add Media
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterSection("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
            filterSection === "all"
              ? "bg-orange text-white"
              : "border border-foreground/15 text-muted hover:border-orange hover:text-orange"
          }`}
        >
          All ({media.length})
        </button>
        {mediaSectionOptions.map((option) => {
          const count = media.filter((m) => m.section === option.value).length;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilterSection(option.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filterSection === option.value
                  ? "bg-orange text-white"
                  : "border border-foreground/15 text-muted hover:border-orange hover:text-orange"
              }`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-2xl bg-card p-6"
        >
          <h3 className="font-bold text-foreground">
            {editingId ? "Edit Media" : "New Media Item"}
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
            <input
              type="text"
              placeholder="Alt text (accessibility)"
              value={form.alt}
              onChange={(e) => setForm({ ...form, alt: e.target.value })}
              className="brand-input"
            />
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              className="brand-input"
            >
              {mediaKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="brand-input"
            >
              {mediaSectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="brand-input"
            >
              {mediaCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Display order"
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: parseInt(e.target.value) || 0 })
              }
              className="brand-input"
            />
          </div>

          <input
            type="text"
            placeholder="Source URL * (e.g. /gallery/photo.jpg or /path/video.mp4)"
            required
            value={form.src}
            onChange={(e) => setForm({ ...form, src: e.target.value })}
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
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className="accent-orange"
              />
              Featured (primary item in section)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Media" : "Create Media"}
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

      {filtered.length === 0 ? (
        <div className="glow-border rounded-2xl bg-card p-12 text-center">
          <ImageIcon size={40} className="mx-auto mb-4 text-orange/60" />
          <p className="text-muted">No media in this section. Add items above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`glow-border overflow-hidden rounded-2xl bg-card ${!item.isActive ? "opacity-50" : ""}`}
            >
              <div className="relative flex h-36 items-center justify-center bg-background-dark">
                {item.kind === "video" ? (
                  <div className="flex flex-col items-center gap-2 text-orange">
                    <Video size={32} />
                    <span className="text-xs font-bold uppercase">Video</span>
                  </div>
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt ?? item.title}
                    fill
                    unoptimized={item.src.startsWith("http")}
                    className="object-cover"
                    sizes="320px"
                  />
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-orange">{sectionLabel(item.section)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="mb-2 truncate text-xs text-muted">{item.src}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span>{item.category}</span>
                  <span>Order: {item.order}</span>
                  {item.isFeatured && (
                    <span className="text-orange">Featured</span>
                  )}
                  <span className={item.isActive ? "text-green-400" : "text-red-400"}>
                    {item.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
