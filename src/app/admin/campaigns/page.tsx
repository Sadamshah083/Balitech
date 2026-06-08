import AdminShell from "@/components/admin/AdminShell";
import CampaignsManager from "@/components/admin/CampaignsManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminCampaignsPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name}>
      <CampaignsManager />
    </AdminShell>
  );
}
