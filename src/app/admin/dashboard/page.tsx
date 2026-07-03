import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import {
  BookOpen,
  Building2,
  ImageIcon,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

const quickLinks = [
  {
    href: "/admin/leads",
    label: "Leads",
    description: "View and manage applicant leads",
    icon: Users,
    roles: ["admin", "manager", "agent"],
  },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    description: "Manage active campaigns",
    icon: Megaphone,
    roles: ["admin"],
  },
  {
    href: "/admin/offices",
    label: "Offices",
    description: "Update branch office details",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/admin/media",
    label: "Gallery & Media",
    description: "Upload and organize media",
    icon: ImageIcon,
    roles: ["admin"],
  },
  {
    href: "/admin/blogs",
    label: "Blogs",
    description: "Create and edit blog posts",
    icon: BookOpen,
    roles: ["admin", "manager"],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Site and admin configuration",
    icon: Settings,
    roles: ["admin"],
  },
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const links = quickLinks.filter((link) => link.roles.includes(admin.role));

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {admin.name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage Bali Tech content, leads, and site settings from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group admin-card rounded-lg border border-orange/20 bg-card p-5 transition hover:border-orange/40 hover:bg-orange/5"
            >
              <div className="mb-3 inline-flex rounded-lg bg-orange/15 p-2 text-orange">
                <link.icon size={20} />
              </div>
              <h3 className="font-bold text-foreground group-hover:text-orange">
                {link.label}
              </h3>
              <p className="mt-1 text-sm text-muted">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
