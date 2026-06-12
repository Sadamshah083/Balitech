"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
      order: blog.order,
      isPublished: blog.isPublished,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      content: form.content,
      image: form.image || null,
      tags: tagsFromInput(form.tagsInput),
      format: form.format,
      order: form.order,
      isPublished: form.isPublished,
    };

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
    }

    setSaving(false);
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
            Manage headings, paragraphs, images, tags, and display format.
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
          className="glow-border mb-8 space-y-4 rounded-2xl bg-card p-6"
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
                    slug: form.slug || slugify(e.target.value),
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
              placeholder="Brief summary for cards"
            />
          </div>

          <div>
            <label className="brand-label mb-1 block">Paragraphs / Content *</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="brand-input w-full resize-y"
              placeholder="Write paragraphs. Separate with blank lines."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-1 block">Cover Image URL</label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="brand-input w-full"
                placeholder="https://images.unsplash.com/..."
              />
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

          {form.image && (
            <div className="relative h-40 w-full overflow-hidden rounded-xl">
              <Image
                src={form.image}
                alt="Preview"
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
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
              className="glow-border flex flex-col gap-4 rounded-2xl bg-card p-4 sm:flex-row sm:items-center"
            >
              {blog.image && (
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-32">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-foreground">{blog.title}</h3>
                  <span className="rounded-full bg-orange/15 px-2 py-0.5 text-xs font-bold uppercase text-orange">
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
                      className="rounded-full border border-orange/30 px-2 py-0.5 text-[10px] font-bold uppercase text-orange"
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
