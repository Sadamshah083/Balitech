import { revalidatePath } from "next/cache";

/**
 * Public pages are prerendered, so an admin edit to offices, blogs, campaigns,
 * vacancies or media would otherwise only reach visitors on the next deploy.
 * Marks every page under the root layout stale; each one re-renders from the
 * live database on its next visit.
 */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
}
