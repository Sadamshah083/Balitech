import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminUser = { id: string; email: string; name: string; role: string };

const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, role: true },
  });

  return admin as AdminUser | null;
});

export async function getAdminIfAuthenticated(): Promise<AdminUser | null> {
  return getAdmin();
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
