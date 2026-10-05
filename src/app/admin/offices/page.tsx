import OfficesManager from "@/components/admin/OfficesManager";
import { requireAdmin } from "@/lib/admin";
import { prefetchOffices } from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function AdminOfficesPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  const offices = await prefetchOffices();

  return <OfficesManager initialData={offices} />;
}
