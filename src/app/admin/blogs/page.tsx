import AdminShell from "@/components/admin/AdminShell";
import BlogsManager from "@/components/admin/BlogsManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminBlogsPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin" && admin.role !== "manager") {
    redirect("/admin/leads");
  }

  return (
    <AdminShell adminName={admin.name} adminRole={admin.role}>
      <BlogsManager />
    </AdminShell>
  );
}
