import LeadDetail from "@/components/admin/LeadDetail";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  // Agents only have access to Blogs.
  if (admin.role === "agent") redirect("/admin/blogs");
  const { id } = await params;
  return <LeadDetail leadId={id} />;
}
