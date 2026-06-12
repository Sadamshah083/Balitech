import AdminShell from "@/components/admin/AdminShell";
import OfficesManager from "@/components/admin/OfficesManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminOfficesPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name}>
      <OfficesManager />
    </AdminShell>
  );
}
