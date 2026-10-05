import CampaignsManager from "@/components/admin/CampaignsManager";
import { requireAdmin } from "@/lib/admin";
import { prefetchCampaigns } from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function AdminCampaignsPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  const campaigns = await prefetchCampaigns();

  return <CampaignsManager initialData={campaigns} />;
}
