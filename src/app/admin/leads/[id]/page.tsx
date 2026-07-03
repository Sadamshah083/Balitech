import AdminShell from "@/components/admin/AdminShell";
import LeadDetail from "@/components/admin/LeadDetail";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <LeadDetail leadId={id} />
    </AdminShell>
  );
}
