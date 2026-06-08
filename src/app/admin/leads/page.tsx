import AdminShell from "@/components/admin/AdminShell";
import LeadsManager from "@/components/admin/LeadsManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLeadsPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name}>
      <LeadsManager />
    </AdminShell>
  );
}
