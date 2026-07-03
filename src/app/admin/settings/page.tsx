import AdminShell from "@/components/admin/AdminShell";
import SettingsManager from "@/components/admin/SettingsManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  // Settings is only accessible by Admin
  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <SettingsManager />
    </AdminShell>
  );
}
