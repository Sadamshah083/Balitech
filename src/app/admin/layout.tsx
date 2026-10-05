import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminIfAuthenticated } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin | Bali Tech",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminIfAuthenticated();

  if (!admin) return children;

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      {children}
    </AdminShell>
  );
}
