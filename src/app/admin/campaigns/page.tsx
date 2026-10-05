import CampaignsManager from "@/components/admin/CampaignsManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminCampaignsPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  return <CampaignsManager />;
}
