"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, ImagePlus, Pencil, Plus, Trash2, Video } from "lucide-react";
import {
  mediaCategoryOptions,
  mediaKindOptions,
  mediaPublicPlacement,
  mediaSectionLabel,
  mediaSectionOptions,
} from "@/lib/media";
import { adminFetch } from "@/lib/admin-token";
import ConfirmDialog from "./ConfirmDialog";
import AdminModal from "./AdminModal";

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
  fromCatalog?: boolean;
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

/** Position inside its section, matching the public sort (order, then title). */
function sectionPosition(item: MediaItem, list: MediaItem[]) {
  const peers = list
    .filter((m) => m.section === item.section)
    .slice()
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const index = peers.findIndex((m) => m.id === item.id);
  return {
    index: index + 1,
    total: peers.length,
  };
}

export default function MediaManager({
  initialData,
}: {
  initialData?: MediaItem[];
}) {
  const [media, setMedia] = useState<MediaItem[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFromCatalog, setEditingFromCatalog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterSection, setFilterSection] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchMedia() {
    const res = await adminFetch("/api/media");
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialData) return;
    const handle = requestAnimationFrame(() => {
      fetchMedia();
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setEditingFromCatalog(false);
    setUploadError("");
    setForm({
      ...emptyForm,
      order:
        (filterSection === "all"
          ? media.length
          : media.filter((m) => m.section === filterSection).length) + 1,
      section: filterSection !== "all" ? filterSection : "gallery",
    });
    setShowForm(true);
  }

  function openEdit(item: MediaItem) {
    setEditingId(item.fromCatalog ? null : item.id);
    setEditingFromCatalog(Boolean(item.fromCatalog));
    setUploadError("");
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

  async function handleFilePick(file: File | null) {
    if (!file) return;
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const maxMb = isVideo ? 90 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(
        `${isVideo ? "Video" : "Image"} is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${maxMb}MB.`,
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await adminFetch("/api/media/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(
          data.error ||
            (res.status === 413
              ? "File is too large for the server."
              : `Upload failed (HTTP ${res.status}).`),
        );
        return;
      }
      setForm((current) => ({
        ...current,
        src: data.url as string,
        kind: (data.kind as string) || current.kind,
        title: current.title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        alt: current.alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      }));
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      setEditingFromCatalog(false);
      await fetchMedia();
    }

    setSaving(false);
  }

  function requestDelete(item: MediaItem) {
    if (item.fromCatalog) {
      setDeleteError(
        "This is still a website default. Click Edit and save it first (or use Sync Website Defaults), then you can delete it."
      );
      setPendingDelete(item);
      return;
    }
    setDeleteError(null);
    setPendingDelete(item);
  }

  async function confirmDelete() {
    const item = pendingDelete;
    if (!item || item.fromCatalog) {
      setPendingDelete(null);
      setDeleteError(null);
      return;
    }
    setDeletePending(true);
    setDeleteError(null);
    const res = await adminFetch(`/api/media/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      setPendingDelete(null);
    } else {
      setDeleteError("Could not delete this item. Please try again.");
    }
    setDeletePending(false);
  }

  async function handleSyncDefaults() {
    setSyncing(true);
    const res = await adminFetch("/api/media/sync", { method: "POST" });
    if (res.ok) {
      await fetchMedia();
    }
    setSyncing(false);
  }

  const filtered = useMemo(() => {
    const list =
      filterSection === "all"
        ? media
        : media.filter((item) => item.section === filterSection);
    return list
      .slice()
      .sort(
        (a, b) =>
          a.section.localeCompare(b.section) ||
          a.order - b.order ||
          a.title.localeCompare(b.title)
      );
  }, [media, filterSection]);

  const deletePlacement = pendingDelete
    ? mediaPublicPlacement(pendingDelete.section)
    : "";
  const deletePos = pendingDelete
    ? sectionPosition(pendingDelete, media)
    : null;

  if (loading) {
    return <p className="text-muted">Loading gallery media...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gallery & Media</h2>
          <p className="text-sm text-muted">
            Edit every photo and video. Cards show the same section order visitors see on the
            website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} />
            Add Media
          </button>
          <button
            type="button"
            onClick={handleSyncDefaults}
            disabled={syncing}
            className="rounded-lg border border-foreground/15 px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-orange hover:text-orange disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync Website Defaults"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterSection("all")}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
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
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
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

      <AdminModal
        open={showForm}
        title={
          editingId
            ? `Edit: ${form.title || "Media"}`
            : editingFromCatalog
              ? `Save to database: ${form.title || "Website default"}`
              : "New Media Item"
        }
        onClose={() => {
          if (saving) return;
          setShowForm(false);
          setEditingId(null);
          setEditingFromCatalog(false);
        }}
        size="lg"
        dismissible={!saving}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Shows on:{" "}
            <span className="font-semibold text-orange">
              {mediaPublicPlacement(form.section)}
            </span>
            {form.order > 0 && (
              <>
                {" "}
                · Display order <span className="text-foreground">{form.order}</span>
              </>
            )}
          </p>

          {(form.src || form.kind === "video") && (
            <div className="relative h-44 overflow-hidden rounded-lg bg-background-dark">
              {form.kind === "video" ? (
                form.src ? (
                  <video
                    src={form.src}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-orange">
                    <Video size={36} />
                  </div>
                )
              ) : form.src ? (
                // Admin preview only — native img so awards/uploads paths always paint.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.src}
                  alt={form.alt || form.title || "Preview"}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-muted">
              Title *
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="brand-input mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              Alt text
              <input
                type="text"
                value={form.alt}
                onChange={(e) => setForm({ ...form, alt: e.target.value })}
                className="brand-input mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              Type
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="brand-input mt-1 w-full"
              >
                {mediaKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">
              Website section *
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="brand-input mt-1 w-full"
              >
                {mediaSectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="brand-input mt-1 w-full"
              >
                {mediaCategoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">
              Position in section (order)
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className="brand-input mt-1 w-full"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-muted">
            Source *
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60"
              >
                <ImagePlus size={16} />
                {uploading ? "Uploading…" : "Choose from PC"}
              </button>
              {form.src && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, src: "" })}
                  className="text-xs font-bold text-muted hover:text-orange"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
              className="sr-only"
              onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
            />
            <input
              type="text"
              required
              value={form.src}
              onChange={(e) => setForm({ ...form, src: e.target.value })}
              placeholder="/gallery/photo.jpg or /path/video.mp4"
              className="brand-input mt-2 w-full"
            />
            {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
            <p className="mt-1 text-[11px] text-muted">
              Upload a photo or video from your PC, or paste an existing path/URL.
            </p>
          </label>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="accent-orange"
              />
              Active (visible on website)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-orange"
              />
              Featured (primary item in section)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Media"
                  : editingFromCatalog
                    ? "Save & Make Editable"
                    : "Create Media"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setEditingFromCatalog(false);
              }}
              className="rounded-lg border border-foreground/15 px-6 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </AdminModal>

      {filtered.length === 0 ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <ImageIcon size={40} className="mx-auto mb-4 text-orange/60" />
          <p className="text-muted">No media in this section. Add items above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const pos = sectionPosition(item, media);
            return (
              <div
                key={item.id}
                className={`glow-border overflow-hidden rounded-lg admin-card bg-card ${!item.isActive ? "opacity-55" : ""}`}
              >
                <div className="relative flex h-44 items-center justify-center bg-background-dark">
                  {item.kind === "video" ? (
                    item.src ? (
                      <video
                        src={item.src}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-orange">
                        <Video size={32} />
                        <span className="text-xs font-bold uppercase">Video</span>
                      </div>
                    )
                  ) : (
                    // Admin grid only — native img so missing optimizer / awards paths still show.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.src}
                      alt={item.alt ?? item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute left-2 top-2 rounded bg-blue-dark/85 px-2 py-1 text-[11px] font-bold text-white shadow">
                    #{pos.index} of {pos.total}
                  </span>
                  <span className="absolute bottom-2 left-2 rounded bg-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    {item.kind === "video" ? "Video" : "Photo"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="text-xs font-semibold text-orange">
                        {mediaSectionLabel(item.section)}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-muted">
                        {mediaPublicPlacement(item.section)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                        title={`Edit ${item.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(item)}
                        className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                        title={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="mb-2 truncate text-xs text-muted" title={item.src}>
                    {item.src}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    <span>{item.category}</span>
                    <span className="font-semibold text-foreground">
                      Order {item.order}
                    </span>
                    {item.fromCatalog && (
                      <span className="text-blue-300">Website default — save to edit fully</span>
                    )}
                    {item.isFeatured && <span className="text-orange">Featured</span>}
                    <span className={item.isActive ? "text-green-400" : "text-red-400"}>
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.fromCatalog ? "Cannot delete yet" : "Delete media?"}
        message={
          pendingDelete?.fromCatalog
            ? `"${pendingDelete?.title ?? ""}" is still a website default. Save it from Edit first, then you can delete it.`
            : `Delete "${pendingDelete?.title ?? ""}"? This is ${pendingDelete?.kind === "video" ? "a video" : "a photo"} in ${deletePlacement}${deletePos ? ` (position #${deletePos.index} of ${deletePos.total})` : ""}. This cannot be undone.`
        }
        confirmLabel={pendingDelete?.fromCatalog ? "Edit & Save" : "Delete"}
        error={deleteError}
        pending={deletePending}
        onConfirm={() => {
          if (pendingDelete?.fromCatalog) {
            const item = pendingDelete;
            setPendingDelete(null);
            setDeleteError(null);
            openEdit(item);
            return;
          }
          void confirmDelete();
        }}
        onCancel={() => {
          if (deletePending) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
