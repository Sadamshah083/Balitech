import LeadsManager from "@/components/admin/LeadsManager";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  prefetchLeads,
  prefetchLeadPositions,
  prefetchLeadBranches,
} from "@/lib/admin-data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  // Agents only have access to Blogs.
  if (admin.role === "agent") redirect("/admin/blogs");

  // Page and filters live in the URL (?page=2&position=...&q=...).
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const key of ["page", "position", "branch", "source", "q"]) {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }

  const [leadsData, positionsData, branches] = await Promise.all([
    prefetchLeads(params),
    prefetchLeadPositions(),
    prefetchLeadBranches(),
  ]);

  return (
    <LeadsManager
      initialFilters={{
        position: params.get("position") ?? "",
        branch: params.get("branch") ?? "",
        source: params.get("source") ?? "",
        q: params.get("q") ?? "",
      }}
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
