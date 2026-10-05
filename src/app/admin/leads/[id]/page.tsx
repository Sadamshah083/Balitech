import LeadDetail from "@/components/admin/LeadDetail";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  return <LeadDetail leadId={id} />;
}
