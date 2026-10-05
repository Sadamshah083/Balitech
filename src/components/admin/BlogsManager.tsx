"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import {
  blogFormatOptions,
  parseTags,
  slugify,
} from "@/lib/blog";
import { adminFetch } from "@/lib/admin-token";
import AdminModal from "./AdminModal";
import ConfirmDialog from "./ConfirmDialog";

type TabKey = "categories" | "tags" | "blogs";

type TagRow = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  categories: { id: string; name: string; slug: string }[];
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  order: number;
  tags: TagRow[];
  postCount: number;
};

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  image: string | null;
  imageAlt: string | null;
  tags: string;
  tagList?: { id: string; name: string; slug: string }[];
  format: string;
  metaTitle: string | null;
  metaDescription: string | null;
  order: number;
  isPublished: boolean;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  categoryId?: string | null;
};

async function readError(res: Response, fallback: string) {
  if (res.status === 401) {
    return "Your admin session has expired. Reload the page and sign in again.";
  }
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error) return data.error;
  } catch {
    /* ignore */
  }
  return `${fallback} (HTTP ${res.status})`;
}

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  image: "",
  imageAlt: "",
  metaTitle: "",
  metaDescription: "",
  isActive: true,
  order: 0,
  tagIds: [] as string[],
};

const emptyTag = {
  name: "",
  slug: "",
  categoryIds: [] as string[],
};

const emptyBlog = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  imageAlt: "",
  format: "standard",
  metaTitle: "",
  metaDescription: "",
  order: 0,
  status: "published",
  scheduledAt: "",
  categoryId: "",
  tagIds: [] as string[],
  newTag: "",
};

export default function BlogsManager() {
  const [tab, setTab] = useState<TabKey>("blogs");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [catQuery, setCatQuery] = useState("");
  const [catStatus, setCatStatus] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [blogQuery, setBlogQuery] = useState("");
  const [blogStatus, setBlogStatus] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagForm, setTagForm] = useState(emptyTag);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState(emptyBlog);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const categoryFileRef = useRef<HTMLInputElement>(null);

  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<CategoryRow | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [pendingDeleteTag, setPendingDeleteTag] = useState<TagRow | null>(null);
  const [pendingDeleteBlog, setPendingDeleteBlog] = useState<BlogRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  async function loadAll() {
    try {
      const [catRes, tagRes, blogRes] = await Promise.all([
        adminFetch("/api/blog-categories"),
        adminFetch("/api/blog-tags"),
        adminFetch("/api/blogs"),
      ]);
      if (!catRes.ok || !tagRes.ok || !blogRes.ok) {
        setListError("Could not load blog CMS data.");
        return;
      }
      const catData = await catRes.json();
      const tagData = await tagRes.json();
      const blogData = await blogRes.json();
      setCategories(catData.categories ?? []);
      setTags(tagData.tags ?? []);
      setBlogs(blogData.blogs ?? []);
      setListError(null);
    } catch {
      setListError("Could not reach the server.");
    } finally {
    setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(loadAll, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, catQuery, catStatus, tagQuery, blogQuery, blogStatus, blogCategory, sortKey]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3200);
  }

  async function ensureSeedCategories() {
    const res = await adminFetch("/api/blog-categories", { method: "PUT" });
    if (!res.ok) {
      setListError(await readError(res, "Could not seed categories"));
      return;
    }
    flash("Default categories synced.");
    await loadAll();
  }

  const filteredCategories = useMemo(() => {
    let rows = [...categories];
    const q = catQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      );
    }
    if (catStatus === "active") rows = rows.filter((c) => c.isActive);
    if (catStatus === "inactive") rows = rows.filter((c) => !c.isActive);
    rows.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    return rows;
  }, [categories, catQuery, catStatus]);

  const filteredTags = useMemo(() => {
    let rows = [...tags];
    const q = tagQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [tags, tagQuery]);

  const filteredBlogs = useMemo(() => {
    let rows = [...blogs];
    const q = blogQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          (b.excerpt ?? "").toLowerCase().includes(q)
      );
    }
    if (blogStatus) rows = rows.filter((b) => b.status === blogStatus);
    if (blogCategory) rows = rows.filter((b) => b.category?.id === blogCategory);
    rows.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "oldest") {
        return +new Date(a.createdAt) - +new Date(b.createdAt);
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return rows;
  }, [blogs, blogQuery, blogStatus, blogCategory, sortKey]);

  const activeRows =
    tab === "categories"
      ? filteredCategories
      : tab === "tags"
        ? filteredTags
        : filteredBlogs;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const pageRows = activeRows.slice((page - 1) * pageSize, page * pageSize);

  async function uploadCategoryImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await adminFetch("/api/blog-categories/upload", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || "Image upload failed.");
        return;
      }
      setCategoryForm((current) => ({ ...current, image: data.url as string }));
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (categoryFileRef.current) categoryFileRef.current.value = "";
    }
  }

  async function uploadBlogImage(file: File | null) {
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
      setBlogForm((current) => ({ ...current, image: data.url as string }));
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm({ ...emptyCategory, order: categories.length + 1 });
    setFormError(null);
    setUploadError("");
    setShowCategoryForm(true);
  }

  function openEditCategory(category: CategoryRow) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image: category.image ?? "",
      imageAlt: category.imageAlt ?? "",
      metaTitle: category.metaTitle ?? "",
      metaDescription: category.metaDescription ?? "",
      isActive: category.isActive,
      order: category.order,
      tagIds: category.tags.map((t) => t.id),
    });
    setFormError(null);
    setUploadError("");
    setShowCategoryForm(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || slugify(categoryForm.name),
      description: categoryForm.description || null,
      image: categoryForm.image || null,
      imageAlt: categoryForm.imageAlt || null,
      metaTitle: categoryForm.metaTitle || null,
      metaDescription: categoryForm.metaDescription || null,
      isActive: categoryForm.isActive,
      order: categoryForm.order,
      tagIds: categoryForm.tagIds,
    };
    const res = editingCategoryId
      ? await adminFetch(`/api/blog-categories/${editingCategoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/blog-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      setFormError(await readError(res, "Could not save category"));
      return;
    }
    setShowCategoryForm(false);
    flash(editingCategoryId ? "Category updated." : "Category created.");
    await loadAll();
  }

  function openCreateTag() {
    setEditingTagId(null);
    setTagForm(emptyTag);
    setFormError(null);
    setShowTagForm(true);
  }

  function openEditTag(tag: TagRow) {
    setEditingTagId(tag.id);
    setTagForm({
      name: tag.name,
      slug: tag.slug,
      categoryIds: tag.categories.map((c) => c.id),
    });
    setFormError(null);
    setShowTagForm(true);
  }

  async function saveTag(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: tagForm.name,
      slug: tagForm.slug || slugify(tagForm.name),
      categoryIds: tagForm.categoryIds,
    };
    const res = editingTagId
      ? await adminFetch(`/api/blog-tags/${editingTagId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/blog-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      setFormError(await readError(res, "Could not save tag"));
      return;
    }
    setShowTagForm(false);
    flash(editingTagId ? "Tag updated." : "Tag created.");
    await loadAll();
  }

  function openCreateBlog() {
    setEditingBlogId(null);
    setBlogForm({
      ...emptyBlog,
      order: blogs.length + 1,
      categoryId: categories.find((c) => c.isActive)?.id ?? "",
    });
    setFormError(null);
    setUploadError("");
    setShowBlogForm(true);
  }

  async function openEditBlog(blog: BlogRow) {
    setEditingBlogId(blog.id);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt ?? "",
      content: blog.content ?? "",
      image: blog.image ?? "",
      imageAlt: blog.imageAlt ?? "",
      format: blog.format,
      metaTitle: blog.metaTitle ?? "",
      metaDescription: blog.metaDescription ?? "",
      order: blog.order,
      status: blog.status || (blog.isPublished ? "published" : "draft"),
      scheduledAt: blog.scheduledAt
        ? new Date(blog.scheduledAt).toISOString().slice(0, 16)
        : "",
      categoryId: blog.category?.id ?? "",
      tagIds: (blog.tagList ?? []).map((t) => t.id),
      newTag: "",
    });
    setFormError(null);
    setUploadError("");
    setShowBlogForm(true);
    setContentLoading(true);
    try {
      const res = await adminFetch(`/api/blogs/${blog.id}`);
      if (!res.ok) {
        setFormError(await readError(res, "Could not load blog content"));
        return;
      }
      const data = await res.json();
      const full = data.blog as BlogRow | undefined;
      if (!full) return;
      setBlogForm({
        title: full.title,
        slug: full.slug,
        excerpt: full.excerpt ?? "",
        content: full.content ?? "",
        image: full.image ?? "",
        imageAlt: full.imageAlt ?? "",
        format: full.format,
        metaTitle: full.metaTitle ?? "",
        metaDescription: full.metaDescription ?? "",
        order: full.order,
        status: full.status || (full.isPublished ? "published" : "draft"),
        scheduledAt: full.scheduledAt
          ? new Date(full.scheduledAt).toISOString().slice(0, 16)
          : "",
        categoryId: full.category?.id ?? "",
        tagIds: (full.tagList ?? []).map((t) => t.id),
        newTag: "",
      });
    } catch {
      setFormError("Could not load blog content.");
    } finally {
      setContentLoading(false);
    }
  }

  async function createInlineTag() {
    const name = blogForm.newTag.trim();
    if (!name) return;
    const res = await adminFetch("/api/blog-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryIds: blogForm.categoryId ? [blogForm.categoryId] : [],
      }),
    });
    if (!res.ok) {
      setFormError(await readError(res, "Could not create tag"));
      return;
    }
    const data = await res.json();
    const tag = data.tag as TagRow;
    setTags((current) =>
      current.some((t) => t.id === tag.id) ? current : [...current, { ...tag, postCount: 0, categories: [] }]
    );
    setBlogForm((current) => ({
      ...current,
      newTag: "",
      tagIds: current.tagIds.includes(tag.id)
        ? current.tagIds
        : [...current.tagIds, tag.id],
    }));
  }

  async function saveBlog(e: React.FormEvent) {
    e.preventDefault();
    if (contentLoading) return;
    setSaving(true);
    setFormError(null);
    if (!blogForm.categoryId) {
      setFormError("Primary category is required.");
      setSaving(false);
      return;
    }
    const payload = {
      title: blogForm.title,
      slug: blogForm.slug || slugify(blogForm.title),
      excerpt: blogForm.excerpt || null,
      content: blogForm.content,
      image: blogForm.image || null,
      imageAlt: blogForm.imageAlt || null,
      format: blogForm.format,
      metaTitle: blogForm.metaTitle || null,
      metaDescription: blogForm.metaDescription || null,
      order: blogForm.order,
      status: blogForm.status,
      scheduledAt: blogForm.status === "scheduled" ? blogForm.scheduledAt : null,
      categoryId: blogForm.categoryId,
      tagIds: blogForm.tagIds,
    };
    const res = editingBlogId
      ? await adminFetch(`/api/blogs/${editingBlogId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!res.ok) {
      setFormError(await readError(res, "Could not save blog"));
      return;
    }
    setShowBlogForm(false);
    flash(editingBlogId ? "Blog updated." : "Blog created.");
    await loadAll();
  }

  async function confirmDeleteCategory() {
    if (!pendingDeleteCategory) return;
    setDeleting(true);
    setDeleteError(null);
    const qs =
      pendingDeleteCategory.postCount > 0 && reassignTo
        ? `?reassignTo=${encodeURIComponent(reassignTo)}`
        : "";
    const res = await adminFetch(
      `/api/blog-categories/${pendingDeleteCategory.id}${qs}`,
      { method: "DELETE" }
    );
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(await readError(res, "Could not delete category"));
      return;
    }
    setPendingDeleteCategory(null);
    setReassignTo("");
    flash("Category deleted.");
    await loadAll();
  }

  async function confirmDeleteTag() {
    if (!pendingDeleteTag) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await adminFetch(`/api/blog-tags/${pendingDeleteTag.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(await readError(res, "Could not delete tag"));
      return;
    }
    setPendingDeleteTag(null);
    flash("Tag deleted. Posts were kept.");
    await loadAll();
  }

  async function confirmDeleteBlog() {
    if (!pendingDeleteBlog) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await adminFetch(`/api/blogs/${pendingDeleteBlog.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(await readError(res, "Could not delete blog"));
      return;
    }
    setPendingDeleteBlog(null);
    flash("Blog deleted.");
    await loadAll();
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "categories", label: "Categories" },
    { key: "tags", label: "Tags" },
    { key: "blogs", label: "Blogs" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-bold tracking-tight text-foreground">
            Blog CMS
          </h2>
          <p className="mt-1 mb-0 text-xs leading-snug text-muted">
            Manage categories, tags, and posts. Changes publish to the public site immediately.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {tab === "categories" && (
            <>
        <button
          type="button"
                className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
                onClick={ensureSeedCategories}
        >
                Sync default categories
        </button>
              <button
                type="button"
                className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
                onClick={openCreateCategory}
              >
                <Plus className="h-4 w-4" /> Add category
              </button>
            </>
          )}
          {tab === "tags" && (
            <button
              type="button"
              className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
              onClick={openCreateTag}
            >
              <Plus className="h-4 w-4" /> Add tag
            </button>
          )}
          {tab === "blogs" && (
            <button
              type="button"
              className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
              onClick={openCreateBlog}
            >
              <Plus className="h-4 w-4" /> Add blog
            </button>
          )}
            </div>
          </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {notice}
          </div>
      )}
      {listError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700" role="alert">
          {listError}
        </div>
      )}

      <div
        className="flex flex-wrap gap-2 border-b border-foreground/10 pb-4"
        role="tablist"
        aria-label="Blog CMS sections"
      >
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-orange text-[#0d1a3a]"
                  : "border border-foreground/15 text-muted hover:border-orange hover:text-orange"
              }`}
            >
              {item.label}
            </button>
          );
        })}
          </div>

      <div className="admin-leads-toolbar !mb-0 items-end">
        <div className="admin-lead-search-wrap admin-leads-toolbar__search">
          <Search className="h-4 w-4" aria-hidden />
              <input
            className="brand-input admin-leads-toolbar__control w-full"
            placeholder={
              tab === "categories"
                ? "Search categories..."
                : tab === "tags"
                  ? "Search tags..."
                  : "Search blogs..."
            }
            value={tab === "categories" ? catQuery : tab === "tags" ? tagQuery : blogQuery}
            onChange={(e) => {
              if (tab === "categories") setCatQuery(e.target.value);
              else if (tab === "tags") setTagQuery(e.target.value);
              else setBlogQuery(e.target.value);
            }}
              />
            </div>
        {tab === "categories" && (
          <div className="admin-leads-toolbar__select">
            <label className="brand-label mb-1 block" htmlFor="blog-cms-cat-status">
              Status
            </label>
              <select
              id="blog-cms-cat-status"
              className="brand-input admin-leads-toolbar__control w-full"
              value={catStatus}
              onChange={(e) => setCatStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
        {tab === "blogs" && (
          <>
            <div className="admin-leads-toolbar__select">
              <label className="brand-label mb-1 block" htmlFor="blog-cms-status">
                Status
              </label>
              <select
                id="blog-cms-status"
                className="brand-input admin-leads-toolbar__control w-full"
                value={blogStatus}
                onChange={(e) => setBlogStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div className="admin-leads-toolbar__select">
              <label className="brand-label mb-1 block" htmlFor="blog-cms-category">
                Category
              </label>
              <select
                id="blog-cms-category"
                className="brand-input admin-leads-toolbar__control w-full"
                value={blogCategory}
                onChange={(e) => setBlogCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-leads-toolbar__select">
              <label className="brand-label mb-1 block" htmlFor="blog-cms-sort">
                Sort
              </label>
              <select
                id="blog-cms-sort"
                className="brand-input admin-leads-toolbar__control w-full"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>
          </div>
          </>
        )}
          </div>

      {loading ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <p className="text-muted">Loading…</p>
            </div>
      ) : tab === "categories" ? (
        filteredCategories.length === 0 ? (
          <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
            <p className="text-muted">No categories yet. Sync defaults or add one.</p>
          </div>
        ) : (
          <div className="admin-surface border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-card text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Image</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                    <th className="px-4 py-3 font-medium">Posts</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as CategoryRow[]).map((category) => (
                    <tr
                      key={category.id}
                      className={`border-t border-foreground/8 hover:bg-surface ${
                        !category.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {category.image ? (
                          <div className="relative h-11 w-16 overflow-hidden rounded-lg">
              <Image
                              src={category.image}
                              alt={category.imageAlt || category.name}
                fill
                className="object-cover"
                              unoptimized={category.image.startsWith("/uploads/")}
                              sizes="64px"
              />
            </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {category.name}
                      </td>
                      <td className="px-4 py-3 text-muted">{category.slug}</td>
                      <td
                        className="max-w-[220px] truncate px-4 py-3 text-muted"
                        title={category.description ?? undefined}
                      >
                        {category.description || "—"}
                      </td>
                      <td
                        className="max-w-[180px] truncate px-4 py-3 text-muted"
                        title={category.tags.map((t) => t.name).join(", ")}
                      >
                        {category.tags.length
                          ? category.tags.map((t) => t.name).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{category.postCount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${
                            category.isActive
                              ? "bg-green-400/10 text-green-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
            <button
                            type="button"
                            onClick={() => openEditCategory(category)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
                            onClick={() => {
                              setPendingDeleteCategory(category);
                              setReassignTo("");
                              setDeleteError(null);
                            }}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : tab === "tags" ? (
        filteredTags.length === 0 ? (
          <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
            <p className="text-muted">No tags yet.</p>
          </div>
        ) : (
          <div className="admin-surface border border-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-card text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Categories</th>
                    <th className="px-4 py-3 font-medium">Posts</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageRows as TagRow[]).map((tag) => (
                    <tr
                      key={tag.id}
                      className="border-t border-foreground/8 hover:bg-surface"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {tag.name}
                      </td>
                      <td className="px-4 py-3 text-muted">{tag.slug}</td>
                      <td
                        className="max-w-[240px] truncate px-4 py-3 text-muted"
                        title={tag.categories.map((c) => c.name).join(", ")}
                      >
                        {tag.categories.length
                          ? tag.categories.map((c) => c.name).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{tag.postCount}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTag(tag)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Edit ${tag.name}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingDeleteTag(tag);
                              setDeleteError(null);
                            }}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                            aria-label={`Delete ${tag.name}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredBlogs.length === 0 ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <p className="text-muted">No blogs match these filters.</p>
        </div>
      ) : (
        <div className="admin-surface border border-foreground/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-card text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Thumbnail</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(pageRows as BlogRow[]).map((blog) => {
                  const tagNames = (
                    blog.tagList ??
                    parseTags(blog.tags).map((name) => ({ name }))
                  ).map((t) => t.name);
                  return (
                    <tr
              key={blog.id}
                      className="border-t border-foreground/8 hover:bg-surface"
            >
                      <td className="px-4 py-3">
                        {blog.image ? (
                          <div className="relative h-11 w-16 overflow-hidden rounded-lg">
                  <Image
                    src={blog.image}
                              alt=""
                    fill
                    className="object-cover"
                              unoptimized={
                                blog.image.startsWith("/blogs/") ||
                                blog.image.startsWith("/uploads/")
                              }
                              sizes="64px"
                  />
                </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 font-medium text-foreground">
                        <span className="line-clamp-2">{blog.title}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {blog.category?.name ?? "—"}
                      </td>
                      <td
                        className="max-w-[200px] truncate px-4 py-3 text-muted"
                        title={tagNames.join(", ")}
                      >
                        {tagNames.length ? tagNames.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3">
                    <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize ${
                            blog.status === "published"
                              ? "bg-green-400/10 text-green-400"
                              : blog.status === "scheduled"
                                ? "bg-sky-400/10 text-sky-300"
                                : "bg-foreground/10 text-muted"
                          }`}
                        >
                          {blog.status}
                    </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {new Date(
                          blog.publishedAt || blog.createdAt
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                <button
                  type="button"
                            onClick={() => openEditBlog(blog)}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`Edit ${blog.title}`}
                >
                            <Pencil size={16} aria-hidden="true" />
                </button>
                          <a
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                            aria-label={`View ${blog.title}`}
                          >
                            <ExternalLink size={16} aria-hidden="true" />
                          </a>
                <button
                  type="button"
                            onClick={() => {
                              setPendingDeleteBlog(blog);
                              setDeleteError(null);
                            }}
                            className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                            aria-label={`Delete ${blog.title}`}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Page {page} of {totalPages} · {activeRows.length} items
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

      <AdminModal
        open={showCategoryForm}
        title={editingCategoryId ? "Edit category" : "Add category"}
        onClose={() => !saving && setShowCategoryForm(false)}
        size="lg"
        dismissible={!saving}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={saving} onClick={() => setShowCategoryForm(false)}>Cancel</button>
            <button type="submit" form="category-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save category"}
            </button>
          </>
        }
      >
        <form id="category-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveCategory}>
          {formError && <p className="sm:col-span-2 text-sm text-red-600" role="alert">{formError}</p>}
          <label className="grid gap-1 text-sm">
            Name *
            <input className="brand-input" required value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <input className="brand-input" value={categoryForm.slug} onChange={(e) => setCategoryForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </label>
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Description
            <textarea className="brand-input min-h-24" value={categoryForm.description} onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <div className="sm:col-span-2 grid gap-2">
            <p className="text-sm font-medium">Category image</p>
            {categoryForm.image ? (
              <div className="relative h-36 w-full max-w-md overflow-hidden rounded-xl">
                <Image src={categoryForm.image} alt={categoryForm.imageAlt || "Preview"} fill className="object-cover" unoptimized={categoryForm.image.startsWith("/uploads/")} sizes="400px" />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" disabled={uploading} onClick={() => categoryFileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
              </button>
              {categoryForm.image && (
                <button type="button" className="btn-secondary" onClick={() => setCategoryForm((f) => ({ ...f, image: "" }))}>
                  Remove image
                </button>
              )}
            </div>
            <input ref={categoryFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif" className="hidden" onChange={(e) => uploadCategoryImage(e.target.files?.[0] ?? null)} />
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
          <label className="grid gap-1 text-sm">
            Image alt text
            <input
              className="brand-input"
              value={categoryForm.imageAlt}
              onChange={(e) => setCategoryForm((f) => ({ ...f, imageAlt: e.target.value }))}
              placeholder="Describe the category image"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Order
            <input type="number" className="brand-input" value={categoryForm.order} onChange={(e) => setCategoryForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Meta title
            <input
              className="brand-input"
              value={categoryForm.metaTitle}
              onChange={(e) => setCategoryForm((f) => ({ ...f, metaTitle: e.target.value }))}
              placeholder="SEO title (defaults to category name)"
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            Meta description
            <textarea
              className="brand-input min-h-20"
              value={categoryForm.metaDescription}
              onChange={(e) => setCategoryForm((f) => ({ ...f, metaDescription: e.target.value }))}
              placeholder="SEO description for search results"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active (show on public site)
          </label>
          <fieldset className="sm:col-span-2 grid gap-2">
            <legend className="text-sm font-medium">Associated tags</legend>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-foreground/10 p-3">
              {tags.map((tag) => {
                const checked = categoryForm.tagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      checked
                        ? "border-orange bg-orange/20 text-orange"
                        : "border-foreground/15 text-muted hover:border-orange/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setCategoryForm((f) => ({
                          ...f,
                          tagIds: checked
                            ? f.tagIds.filter((id) => id !== tag.id)
                            : [...f.tagIds, tag.id],
                        }))
                      }
                    />
                    <Tags className="h-3.5 w-3.5" /> {tag.name}
                  </label>
                );
              })}
              {tags.length === 0 && <span className="text-sm text-muted">Create tags in the Tags tab first.</span>}
            </div>
          </fieldset>
        </form>
      </AdminModal>

      <AdminModal
        open={showTagForm}
        title={editingTagId ? "Edit tag" : "Add tag"}
        onClose={() => !saving && setShowTagForm(false)}
        dismissible={!saving}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={saving} onClick={() => setShowTagForm(false)}>Cancel</button>
            <button type="submit" form="tag-form" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save tag"}
            </button>
          </>
        }
      >
        <form id="tag-form" className="grid gap-4" onSubmit={saveTag}>
          {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
          <label className="grid gap-1 text-sm">
            Name *
            <input className="brand-input" required value={tagForm.name} onChange={(e) => setTagForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <input className="brand-input" value={tagForm.slug} onChange={(e) => setTagForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Associated categories</legend>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-foreground/10 p-3">
              {categories.map((category) => {
                const checked = tagForm.categoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      checked
                        ? "border-orange bg-orange/20 text-orange"
                        : "border-foreground/15 text-muted hover:border-orange/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setTagForm((f) => ({
                          ...f,
                          categoryIds: checked
                            ? f.categoryIds.filter((id) => id !== category.id)
                            : [...f.categoryIds, category.id],
                        }))
                      }
                    />
                    {category.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </form>
      </AdminModal>

      <AdminModal
        open={showBlogForm}
        title={editingBlogId ? "Edit blog" : "Add blog"}
        onClose={() => !saving && setShowBlogForm(false)}
        size="lg"
        dismissible={!saving}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={saving || contentLoading} onClick={() => setShowBlogForm(false)}>Cancel</button>
            <button type="submit" form="blog-form" className="btn-primary" disabled={saving || contentLoading}>
              {saving ? "Saving…" : contentLoading ? "Loading…" : "Save blog"}
            </button>
          </>
        }
      >
        <form id="blog-form" className="grid gap-4 sm:grid-cols-2" onSubmit={saveBlog}>
          {formError && <p className="sm:col-span-2 text-sm text-red-600" role="alert">{formError}</p>}
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Title *
            <input className="brand-input" required value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value, slug: editingBlogId ? f.slug : slugify(e.target.value) }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <input className="brand-input" value={blogForm.slug} onChange={(e) => setBlogForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Primary category *
            <select className="brand-input" required value={blogForm.categoryId} onChange={(e) => setBlogForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (inactive)"}</option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Excerpt
            <textarea className="brand-input min-h-20" value={blogForm.excerpt} onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))} />
          </label>
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Content *
            <textarea
              className="brand-input min-h-48"
              required
              disabled={contentLoading}
              value={contentLoading ? "Loading content…" : blogForm.content}
              onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2 grid gap-2">
            <p className="text-sm font-medium">Cover image</p>
            {blogForm.image ? (
              <div className="relative h-40 w-full max-w-lg overflow-hidden rounded-xl">
                <Image
                  src={blogForm.image}
                  alt={blogForm.imageAlt || blogForm.title || "Cover preview"}
                  fill
                  className="object-cover"
                  unoptimized={blogForm.image.startsWith("/blogs/") || blogForm.image.startsWith("/uploads/")}
                  sizes="480px"
                />
        </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
              </button>
              {blogForm.image && (
                <button type="button" className="btn-secondary" onClick={() => setBlogForm((f) => ({ ...f, image: "", imageAlt: "" }))}>Remove image</button>
      )}
    </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadBlogImage(e.target.files?.[0] ?? null)} />
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Cover image alt text
            <input
              className="brand-input"
              value={blogForm.imageAlt}
              onChange={(e) => setBlogForm((f) => ({ ...f, imageAlt: e.target.value }))}
              placeholder="Describe the cover for accessibility & SEO (defaults to meta description / title)"
            />
          </label>
          <fieldset className="sm:col-span-2 grid gap-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-xl border border-foreground/10 p-3">
              {tags.map((tag) => {
                const checked = blogForm.tagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      checked
                        ? "border-orange bg-orange/20 text-orange"
                        : "border-foreground/15 text-muted hover:border-orange/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setBlogForm((f) => ({
                          ...f,
                          tagIds: checked
                            ? f.tagIds.filter((id) => id !== tag.id)
                            : [...f.tagIds, tag.id],
                        }))
                      }
                    />
                    {tag.name}
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="brand-input flex-1"
                placeholder="Create new tag…"
                value={blogForm.newTag}
                onChange={(e) => setBlogForm((f) => ({ ...f, newTag: e.target.value }))}
              />
              <button type="button" className="btn-secondary" onClick={createInlineTag}>
                Add tag
              </button>
            </div>
          </fieldset>
          <label className="grid gap-1 text-sm">
            Format
            <select className="brand-input" value={blogForm.format} onChange={(e) => setBlogForm((f) => ({ ...f, format: e.target.value }))}>
              {blogFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Status
            <select className="brand-input" value={blogForm.status} onChange={(e) => setBlogForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
          {blogForm.status === "scheduled" && (
            <label className="sm:col-span-2 grid gap-1 text-sm">
              Schedule for
              <input type="datetime-local" className="brand-input" required value={blogForm.scheduledAt} onChange={(e) => setBlogForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </label>
          )}
          <label className="grid gap-1 text-sm">
            Meta title
            <input className="brand-input" value={blogForm.metaTitle} onChange={(e) => setBlogForm((f) => ({ ...f, metaTitle: e.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm">
            Order
            <input type="number" className="brand-input" value={blogForm.order} onChange={(e) => setBlogForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))} />
          </label>
          <label className="sm:col-span-2 grid gap-1 text-sm">
            Meta description
            <textarea className="brand-input min-h-20" value={blogForm.metaDescription} onChange={(e) => setBlogForm((f) => ({ ...f, metaDescription: e.target.value }))} />
          </label>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(pendingDeleteCategory)}
        title="Delete category"
        onClose={() => !deleting && setPendingDeleteCategory(null)}
        dismissible={!deleting}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={deleting} onClick={() => setPendingDeleteCategory(null)}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              disabled={
                deleting ||
                Boolean(pendingDeleteCategory && pendingDeleteCategory.postCount > 0 && !reassignTo)
              }
              onClick={confirmDeleteCategory}
            >
              {deleting ? "Deleting…" : "Delete category"}
            </button>
          </>
        }
      >
        {pendingDeleteCategory && (
          <div className="space-y-3 text-sm">
            <p>
              Delete <strong>{pendingDeleteCategory.name}</strong>? Blog posts will not be deleted.
            </p>
            {pendingDeleteCategory.postCount > 0 && (
              <label className="grid gap-1">
                Reassign {pendingDeleteCategory.postCount} post(s) to *
                <select className="brand-input" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} required>
                  <option value="">Choose category</option>
                  {categories
                    .filter((c) => c.id !== pendingDeleteCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </label>
            )}
            {deleteError && <p className="text-red-600" role="alert">{deleteError}</p>}
          </div>
        )}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(pendingDeleteTag)}
        title="Delete tag"
        message={
          pendingDeleteTag
            ? `Delete “${pendingDeleteTag.name}”? Associations will be removed; posts stay published.`
            : ""
        }
        pending={deleting}
        error={deleteError}
        onConfirm={confirmDeleteTag}
        onCancel={() => setPendingDeleteTag(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteBlog)}
        title="Delete blog"
        message={
          pendingDeleteBlog
            ? `Permanently delete “${pendingDeleteBlog.title}”? This cannot be undone.`
            : ""
        }
        pending={deleting}
        error={deleteError}
        onConfirm={confirmDeleteBlog}
        onCancel={() => setPendingDeleteBlog(null)}
      />
    </div>
  );
}
