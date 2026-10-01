import { revalidatePath } from "next/cache";

/**
 * Public pages are prerendered, so an admin edit to offices, blogs, campaigns,
 * vacancies or media would otherwise only reach visitors on the next deploy.
 * Marks every page under the root layout stale; each one re-renders from the
 * live database on its next visit.
 *
 * `/sitemap.xml` and `/llms.txt` are route handlers, not layout children, so
 * they need their own revalidatePath calls — otherwise a newly published blog
 * stays missing from both until the next deploy or the hourly rebuild.
 */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}
