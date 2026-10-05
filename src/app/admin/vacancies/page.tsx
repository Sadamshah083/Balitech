import VacanciesManager from "@/components/admin/VacanciesManager";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminVacanciesPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin" && admin.role !== "manager") {
    redirect("/admin/leads");
  }

  return <VacanciesManager />;
}
