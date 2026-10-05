import LeadsManager from "@/components/admin/LeadsManager";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLeadsPage() {
  await requireAdmin();
  return <LeadsManager />;
}
