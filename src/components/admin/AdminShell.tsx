"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Building2, ImageIcon, LayoutDashboard, LogOut, Megaphone, Users } from "lucide-react";
import { adminFetch, clearAdminToken } from "@/lib/admin-token";

const navItems = [
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/offices", label: "Offices", icon: Building2 },
  { href: "/admin/media", label: "Gallery & Media", icon: ImageIcon },
  { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
];

export default function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await adminFetch("/api/auth/logout", { method: "POST" });
    clearAdminToken();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 flex-col border-r border-orange/20 bg-card">
        <div className="border-b border-orange/20 p-6">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black uppercase tracking-tight text-orange">
              Bali
            </span>
            <span className="text-muted">•</span>
            <span className="text-lg font-black uppercase tracking-tight text-foreground">
              Tech
            </span>
          </div>
          <p className="brand-label mt-3">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-orange/20 text-orange"
                    : "text-muted hover:bg-orange/10 hover:text-orange"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-orange/20 p-4">
          <p className="mb-3 truncate text-xs text-muted">{adminName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/70 transition hover:bg-orange/10 hover:text-orange"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between gap-3 border-b border-orange/20 bg-card px-8 py-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={20} className="text-orange" />
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
