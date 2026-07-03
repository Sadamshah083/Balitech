"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-token";
import { Plus, Pencil, Trash2 } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  plainPassword?: string | null;
  createdAt: string;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "agent",
};

export default function SettingsManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchUsers() {
    const res = await adminFetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchUsers();
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  function openCreate() {
    setError("");
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(user: User) {
    setError("");
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: user.plainPassword || "",
      role: user.role,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      id: editingId || undefined,
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    const res = editingId
      ? await adminFetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save user");
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setError("");
    const res = await adminFetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete user");
    }
  }

  if (loading) {
    return <p className="text-muted">Loading settings...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Settings</h2>
          <p className="text-sm text-muted">
            Manage system access for Administrators, Managers, and Agents
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glow-border mb-8 space-y-4 rounded-lg admin-card bg-card p-6"
        >
          <h3 className="font-bold text-foreground">
            {editingId ? "Edit User Account" : "New User Account"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="brand-label mb-2 block">Name *</label>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Email *</label>
              <input
                type="email"
                placeholder="email@balitech.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Password *</label>
              <input
                type="text"
                placeholder="Enter password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="brand-input w-full"
              />
            </div>
            <div>
              <label className="brand-label mb-2 block">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="brand-input w-full"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update User" : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg border border-foreground/15 px-6 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="glow-border rounded-lg admin-card bg-card p-12 text-center">
          <p className="text-muted">No users found.</p>
        </div>
      ) : (
        <div className="admin-surface border border-foreground/10">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-card text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">User ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Password</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Date Created</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-foreground/8 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted max-w-[120px] truncate">
                    {user.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {user.plainPassword || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize ${
                        user.role === "admin"
                          ? "bg-orange/10 text-orange"
                          : user.role === "manager"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-green-400/10 text-green-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-orange"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
