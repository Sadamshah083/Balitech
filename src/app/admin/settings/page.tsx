import SettingsManager from "@/components/admin/SettingsManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  return <SettingsManager />;
}
