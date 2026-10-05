import BlogsManager from "@/components/admin/BlogsManager";
import { requireAdmin } from "@/lib/admin";
import {
  prefetchBlogCategories,
  prefetchBlogTags,
  prefetchBlogs,
} from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function AdminBlogsPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin" && admin.role !== "manager") {
    redirect("/admin/leads");
  }

  const [categories, tags, blogs] = await Promise.all([
    prefetchBlogCategories(),
    prefetchBlogTags(),
    prefetchBlogs(),
  ]);

  return (
    <BlogsManager
      initialData={{ categories, tags, blogs }}
    />
  );
}
