import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  Building2,
  FileText,
  ImageIcon,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function loadKpis() {
  const since = new Date(Date.now() - WEEK_MS);
  const [
    leads,
    leadsThisWeek,
    cvs,
    campaigns,
    activeCampaigns,
    offices,
    activeOffices,
    blogs,
    publishedBlogs,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
    prisma.lead.count({ where: { NOT: { cvPath: null } } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { isActive: true } }),
    prisma.office.count(),
    prisma.office.count({ where: { isActive: true } }),
    prisma.blog.count(),
    prisma.blog.count({ where: { isPublished: true } }),
  ]);

  const cvShare = leads > 0 ? Math.round((cvs / leads) * 100) : 0;

  return [
    {
      label: "Total Leads",
      value: leads,
      detail: `+${leadsThisWeek} in the last 7 days`,
      href: "/admin/leads",
      icon: Users,
      roles: ["admin", "manager", "agent"],
    },
    {
      label: "CVs Received",
      value: cvs,
      detail: `${cvShare}% of leads sent a CV`,
      href: "/admin/leads",
      icon: FileText,
      roles: ["admin", "manager", "agent"],
    },
    {
      label: "Total Campaigns",
      value: campaigns,
      detail: `${activeCampaigns} active`,
      href: "/admin/campaigns",
      icon: Megaphone,
      roles: ["admin"],
    },
    {
      label: "Total Branches",
      value: offices,
      detail: `${activeOffices} shown on the website`,
      href: "/admin/offices",
      icon: Building2,
      roles: ["admin"],
    },
    {
      label: "Blogs Uploaded",
      value: blogs,
      detail: `${publishedBlogs} published`,
      href: "/admin/blogs",
      icon: BookOpen,
      roles: ["admin", "manager"],
    },
  ];
}

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
  const kpis = (await loadKpis()).filter((kpi) => kpi.roles.includes(admin.role));

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

        <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group admin-card rounded-lg border border-orange/25 bg-card p-5 transition hover:border-orange/50 hover:bg-orange/5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {kpi.label}
                </p>
                <span className="inline-flex rounded-lg bg-orange/15 p-2 text-orange">
                  <kpi.icon size={18} aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums text-foreground group-hover:text-orange">
                {kpi.value.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-xs text-muted">{kpi.detail}</p>
            </Link>
          ))}
        </section>

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
