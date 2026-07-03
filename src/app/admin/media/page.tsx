import AdminShell from "@/components/admin/AdminShell";
import MediaManager from "@/components/admin/MediaManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminMediaPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <MediaManager />
    </AdminShell>
  );
}
