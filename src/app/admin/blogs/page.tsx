import AdminShell from "@/components/admin/AdminShell";
import BlogsManager from "@/components/admin/BlogsManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminBlogsPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name}>
      <BlogsManager />
    </AdminShell>
  );
}
