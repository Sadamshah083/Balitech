"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  blogFormatOptions,
  parseTags,
  slugify,
  tagsFromInput,
  tagsToInput,
} from "@/lib/blog";
import { adminFetch } from "@/lib/admin-token";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  tags: string;
  format: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
  isPublished: boolean;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  tagsInput: "",
  format: "standard",
  metaTitle: "",
  metaDescription: "",
  order: 0,
  isPublished: true,
};

export default function BlogsManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchBlogs() {
    const res = await adminFetch("/api/blogs");
    if (res.ok) {
      const data = await res.json();
      setBlogs(data.blogs);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchBlogs();
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, order: blogs.length + 1 });
    setUploadError("");
    setSaveError("");
    setShowForm(true);
  }

  function openEdit(blog: Blog) {
    setEditingId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt ?? "",
      content: blog.content,
      image: blog.image ?? "",
      tagsInput: tagsToInput(blog.tags),
      format: blog.format,
      metaTitle: blog.metaTitle ?? "",
      metaDescription: blog.metaDescription ?? "",
      order: blog.order,
      isPublished: blog.isPublished,
    });
    setUploadError("");
    setSaveError("");
    setShowForm(true);
  }

  async function handleImagePick(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await adminFetch("/api/blogs/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || "Image upload failed.");
        return;
      }
      setForm((current) => ({ ...current, image: data.url as string }));
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      content: form.content,
      image: form.image || null,
      tags: tagsFromInput(form.tagsInput),
      format: form.format,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      order: form.order,
      isPublished: form.isPublished,
    };

    try {
      const res = editingId
        ? await adminFetch(`/api/blogs/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await adminFetch("/api/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm);
        await fetchBlogs();
      } else {
        /* The API names the field that is wrong; show it rather than leaving
           the form sitting there as if nothing happened. */
        const data = await res.json().catch(() => ({}));
        setSaveError(
          data.error ||
            (res.status === 401
              ? "Your session has expired. Log in again and retry."
              : "The blog could not be saved. Please try again.")
        );
      }
    } catch {
      setSaveError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post?")) return;
    const res = await adminFetch(`/api/blogs/${id}`, { method: "DELETE" });
    if (res.ok) fetchBlogs();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blog Posts</h2>
          <p className="mt-1 text-sm text-muted">
            Write HTML content, upload a cover from your PC, and set SEO tags and meta.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
        >
          <Plus size={16} />
          Add Blog
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-lg admin-card bg-card p-6"
        >
          <h3 className="font-bold text-foreground">
            {editingId ? "Edit Blog" : "New Blog"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-1 block">Heading *</label>
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: editingId ? form.slug : slugify(e.target.value),
                  })
                }
                className="brand-input w-full"
                placeholder="Blog title"
              />
            </div>
            <div>
              <label className="brand-label mb-1 block">URL Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="brand-input w-full"
                placeholder="blog-url-slug"
              />
            </div>
          </div>

          <div>
            <label className="brand-label mb-1 block">Short Excerpt</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="brand-input w-full resize-none"
              placeholder="Brief summary shown on blog cards"
            />
          </div>

          <div>
            <label className="brand-label mb-1 block">Content (HTML) *</label>
            <textarea
              required
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="brand-input w-full resize-y font-mono text-sm"
              placeholder={`<p>Opening paragraph…</p>\n\n<h2>Section heading</h2>\n<p>More detail with <strong>bold</strong> text.</p>\n<ul>\n  <li>Point one</li>\n  <li>Point two</li>\n</ul>`}
            />
            <p className="mt-1 text-xs text-muted">
              Use HTML tags such as &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, and &lt;a&gt;.
              Plain text without tags is also fine — it will display as paragraphs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-1 block">Cover Image</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60"
                >
                  <ImagePlus size={16} />
                  {uploading ? "Uploading…" : "Choose picture from PC"}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="text-xs font-bold text-muted hover:text-orange"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className="sr-only"
                onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
              />
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="brand-input mt-2 w-full"
                placeholder="Or paste an image URL / path"
              />
              {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
            </div>
            <div>
              <label className="brand-label mb-1 block">Display Format</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="brand-input w-full"
              >
                {blogFormatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.image && (
            <div className="relative h-40 w-full overflow-hidden rounded-lg">
              <Image
                src={form.image}
                alt="Cover preview"
                fill
                unoptimized={form.image.startsWith("/blogs/") || form.image.startsWith("/uploads/")}
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}

          <div>
            <label className="brand-label mb-1 block">Tags (comma separated)</label>
            <input
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              className="brand-input w-full"
              placeholder="BPO, Campaigns, Team"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-1 block">SEO Meta Title</label>
              <input
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                className="brand-input w-full"
                maxLength={120}
                placeholder="Optional — defaults to post title"
              />
            </div>
            <div>
              <label className="brand-label mb-1 block">SEO Meta Description</label>
              <textarea
                rows={2}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                className="brand-input w-full resize-none"
                maxLength={320}
                placeholder="Optional — defaults to excerpt"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: Number(e.target.value) })
                }
                className="brand-input w-full"
              />
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
                className="accent-orange"
              />
              Published on website
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-bold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Blog" : "Create Blog"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary rounded-lg px-6 py-2 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
          {saveError && (
            <p role="alert" className="text-sm text-red-400">
              {saveError}
            </p>
          )}
        </form>
      )}

      {loading ? (
        <p className="text-muted">Loading blogs...</p>
      ) : blogs.length === 0 ? (
        <p className="text-muted">No blogs yet. Add your first post.</p>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="glow-border flex flex-col gap-4 rounded-lg admin-card bg-card p-4 sm:flex-row sm:items-center"
            >
              {blog.image && (
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-32">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    unoptimized={blog.image.startsWith("/blogs/") || blog.image.startsWith("/uploads/")}
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-foreground">{blog.title}</h3>
                  <span className="rounded-lg bg-orange/15 px-2 py-0.5 text-xs font-bold uppercase text-orange">
                    {blog.format}
                  </span>
                  {!blog.isPublished && (
                    <span className="text-xs text-muted">(Draft)</span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {blog.excerpt}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {parseTags(blog.tags).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-orange/30 px-2 py-0.5 text-[10px] font-bold uppercase text-orange"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(blog)}
                  className="rounded-lg p-2 text-muted hover:bg-orange/10 hover:text-orange"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(blog.id)}
                  className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
