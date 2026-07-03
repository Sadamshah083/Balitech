import AdminShell from "@/components/admin/AdminShell";
import OfficesManager from "@/components/admin/OfficesManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminOfficesPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <OfficesManager />
    </AdminShell>
  );
}
