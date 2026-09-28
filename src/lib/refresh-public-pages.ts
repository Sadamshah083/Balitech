import { revalidatePath } from "next/cache";

/**
 * Public pages are prerendered, so an admin edit to offices, blogs, campaigns,
 * vacancies or media would otherwise only reach visitors on the next deploy.
 * Marks every page under the root layout stale; each one re-renders from the
 * live database on its next visit.
 *
 * The sitemap and llms.txt are route handlers, not pages, so the layout
 * refresh does not reach them. They are named here so a newly published blog
 * is listed for search engines straight away, not only after a rebuild.
 */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}
