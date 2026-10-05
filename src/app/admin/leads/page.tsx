import LeadsManager from "@/components/admin/LeadsManager";
import { requireAdmin } from "@/lib/admin";
import {
  prefetchLeads,
  prefetchLeadPositions,
  prefetchLeadBranches,
} from "@/lib/admin-data";

export default async function AdminLeadsPage() {
  await requireAdmin();

  const [leadsData, positionsData, branches] = await Promise.all([
    prefetchLeads(),
    prefetchLeadPositions(),
    prefetchLeadBranches(),
  ]);

  return (
    <LeadsManager
      initialData={{
        leads: leadsData.leads,
        pagination: leadsData.pagination,
        positions: positionsData.positions,
        totals: positionsData.totals,
        branches,
      }}
    />
  );
}
