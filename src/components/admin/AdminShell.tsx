"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { adminFetch, clearAdminToken } from "@/lib/admin-token";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/offices", label: "Offices", icon: Building2 },
  { href: "/admin/media", label: "Gallery & Media", icon: ImageIcon },
  { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/leads": "Leads",
  "/admin/campaigns": "Campaigns",
  "/admin/offices": "Offices",
  "/admin/media": "Gallery & Media",
  "/admin/blogs": "Blogs",
  "/admin/settings": "Settings",
};

function getPageTitle(pathname: string) {
  const match = navItems.find((item) => pathname.startsWith(item.href));
  return match ? pageTitles[match.href] ?? match.label : "Admin";
}

export default function AdminShell({
  children,
  adminName,
  adminRole = "admin",
}: {
  children: React.ReactNode;
  adminName: string;
  adminRole?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAgent = adminRole === "agent";
  const isManager = adminRole === "manager";
  const isAdmin = adminRole === "admin";

  const hasAccess = (href: string) => {
    if (href === "/admin/dashboard") return true;
    if (isAdmin) return true;
    if (isManager) {
      return href === "/admin/leads" || href === "/admin/blogs";
    }
    if (isAgent) {
      return href === "/admin/leads";
    }
    return false;
  };

  useEffect(() => {
    if (!hasAccess(pathname)) {
      router.push("/admin/dashboard");
    }
  }, [pathname, adminRole]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const filteredNavItems = navItems.filter((item) => hasAccess(item.href));
  const pageTitle = getPageTitle(pathname);

  async function handleLogout() {
    await adminFetch("/api/auth/logout", { method: "POST" });
    clearAdminToken();
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <>
      <div className="admin-sidebar__brand border-b border-orange/20 p-5">
        <Link href="/admin/dashboard" className="inline-block">
          <img
            src="/bali-tech-logo.png"
            alt="BaliTech Pvt. Ltd"
            className="mx-auto h-10 w-auto object-contain"
          />
        </Link>
        <p className="brand-label mt-2 text-center text-xs uppercase tracking-widest text-muted">
          Admin Panel
        </p>
      </div>

      <nav className="admin-sidebar__nav flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
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

      <div className="admin-sidebar__footer shrink-0 border-t border-orange/20 bg-card p-4">
        <p className="mb-3 truncate text-xs font-bold capitalize text-muted">
          {adminName} ({adminRole})
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground/70 transition hover:bg-orange/10 hover:text-orange"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-shell min-h-dvh bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="admin-sidebar__backdrop fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-orange/20 bg-card transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-lg p-2 text-muted transition hover:bg-orange/10 hover:text-orange lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      <main className="admin-main min-h-dvh lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-orange/20 bg-card px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-lg p-2 text-muted transition hover:bg-orange/10 hover:text-orange lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <LayoutDashboard size={20} className="hidden text-orange sm:block" />
            <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
