import AdminShell from "@/components/admin/AdminShell";
import MediaManager from "@/components/admin/MediaManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminMediaPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name}>
      <MediaManager />
    </AdminShell>
  );
}
