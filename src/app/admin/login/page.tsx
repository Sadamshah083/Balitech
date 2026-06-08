"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandArcs, BrandBubbles } from "@/components/brand/BrandDecorations";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <BrandArcs className="left-8 top-1/3 hidden sm:block" />
      <BrandBubbles className="right-16 top-20 hidden sm:flex" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-baseline justify-center gap-2">
            <span className="text-2xl font-black uppercase tracking-tight text-orange">
              Bali
            </span>
            <span className="text-muted text-xl">•</span>
            <span className="text-2xl font-black uppercase tracking-tight text-foreground">
              Tech
            </span>
          </div>
          <p className="brand-label mb-2">Admin Panel</p>
          <h1 className="brand-heading text-2xl">Sign In</h1>
          <div className="mx-auto mt-3 h-px w-12 bg-white/40" />
          <p className="mt-3 text-sm text-muted">
            Manage leads and campaigns
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glow-border space-y-5 rounded-2xl bg-card p-8"
        >
          <div>
            <label className="brand-label mb-2 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brand-input w-full"
            />
          </div>
          <div>
            <label className="brand-label mb-2 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="brand-input w-full"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-full py-3 font-bold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
