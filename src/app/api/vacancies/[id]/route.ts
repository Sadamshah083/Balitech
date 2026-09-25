import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { refreshPublicPages } from "@/lib/refresh-public-pages";
import { toAdminVacancy, toVacancyData } from "@/lib/careers/vacancies";

type RouteContext = { params: Promise<{ id: string }> };

const EDITOR_ROLES = new Set(["admin", "manager"]);

async function authorize(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;
  if (!EDITOR_ROLES.has(auth.session.role)) {
    return NextResponse.json({ error: "Only admins and managers can edit vacancies." }, { status: 403 });
  }
  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorize(request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const parsed = toVacancyData(await request.json(), true);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const row = await prisma.vacancy.update({ where: { id }, data: parsed.data });
    refreshPublicPages();
    return NextResponse.json({ vacancy: toAdminVacancy(row) });
  } catch (error) {
    console.error("[api/vacancies] update failed:", error);
    return NextResponse.json({ error: "Failed to update vacancy" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await authorize(request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    await prisma.vacancy.delete({ where: { id } });
    refreshPublicPages();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vacancies] delete failed:", error);
    return NextResponse.json({ error: "Failed to delete vacancy" }, { status: 500 });
  }
}
