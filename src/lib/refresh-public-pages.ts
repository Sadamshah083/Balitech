import { revalidatePath } from "next/cache";

/**
 * Public pages are prerendered, so an admin edit to offices, blogs, campaigns,
 * vacancies or media would otherwise only reach visitors on the next deploy.
 *
 * Use the `layout` type for listing trees (`/`, `/blog`, `/career`) so nested
 * routes (home recent blogs, `/blog/[slug]`, `/blog/category/[slug]`, career
 * detail) invalidate together with the index. Route handlers need their own
 * calls — they are not covered by the root layout refresh.
 */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
  revalidatePath("/blog", "layout");
  revalidatePath("/career", "layout");
  revalidatePath("/join-us");
  revalidatePath("/our-offices");
  revalidatePath("/gallery");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}
