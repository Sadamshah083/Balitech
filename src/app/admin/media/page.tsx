import MediaManager from "@/components/admin/MediaManager";
import { requireAdmin } from "@/lib/admin";
import { prefetchMedia } from "@/lib/admin-data";
import { redirect } from "next/navigation";

export default async function AdminMediaPage() {
  const admin = await requireAdmin();

  if (admin.role !== "admin") {
    redirect("/admin/leads");
  }

  const media = await prefetchMedia();

  return <MediaManager initialData={media} />;
}
