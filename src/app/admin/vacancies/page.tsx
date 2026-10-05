import VacanciesManager from "@/components/admin/VacanciesManager";
import { requireAdmin } from "@/lib/admin";
import {
  prefetchVacancies,
  prefetchVacancyBranches,
  prefetchVacancyCampaigns,
} from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function AdminVacanciesPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin" && admin.role !== "manager") {
    redirect("/admin/leads");
  }

  const [vacancies, branches, campaigns] = await Promise.all([
    prefetchVacancies(),
    prefetchVacancyBranches(),
    prefetchVacancyCampaigns(),
  ]);

  return (
    <VacanciesManager
      initialData={{ vacancies, branches, campaigns }}
    />
  );
}
